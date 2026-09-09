import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCardDelivery } from './card-delivery.mjs';

const legacyUrl = 'https://script.google.com/macros/s/legacy-test/exec';
const backendUrl = 'https://script.google.com/macros/s/backend-test/exec';
const row = (submissionID, values = {}) => ({
  submissionID, submittedAt: new Date('2026-09-09T12:34:56.123Z'), userID: 'test123',
  firstName: 'Test', lastName: 'Example', email: 'test@example.invalid', phone: '+442079460018',
  textOK: false, dept: 'CHEM', subfield: 'Research group', card: true, contract: 'saa',
  year: '2024', getInvolved: true, additionalDept: 'PHYS', additionalSubfield: null,
  teaching: false, ...values,
});

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'igwc-delivery-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const calls = [], logs = [], rows = [row(1310), row(1311), row(1312)];
  const options = {
    directory, afterId: 1310, term: '2026-fall', legacyUrl, backendUrl, websiteToken: 'private-test-token',
    loadSubmissions: async (afterId, limit) => rows.filter(row => row.submissionID > afterId).slice(0, limit),
    log: entry => logs.push(entry),
    fetch: async (url, request) => {
      calls.push({ url, body: JSON.parse(request.body) });
      assert.equal(request.redirect, 'follow');
      return { ok: true, json: async () => url === legacyUrl ? { result: 'success' }
        : { ok: true, result: { status: 'saved', dashboardsUpdated: true } } };
    },
  };
  return { options, calls, logs, rows, state: async () => JSON.parse(await readFile(join(directory, 'progress.json'), 'utf8')) };
}

test('delivers native rows to both sheets above the explicit migration cutoff, with stable fields and no PII checkpoint', async t => {
  const h = await fixture(t);
  await createCardDelivery(h.options).drain();
  assert.deepEqual(h.calls.map(x => [x.url, x.body.submissionID]), [
    [legacyUrl, 1311], [legacyUrl, 1312], [backendUrl, 1311], [backendUrl, 1312],
  ]);
  const v2 = h.calls[2].body;
  assert.equal(v2.schemaVersion, 2);
  assert.equal(v2.action, 'recordCard');
  assert.equal(v2.submittedAt, '2026-09-09T12:34:56.123Z');
  assert.equal(v2.term, '2026-fall');
  assert.equal(v2.textOK, false);
  assert.equal(v2.additionalSubfield, null);
  assert.equal(v2.phone, '+442079460018');
  assert.match(h.calls[0].body.location, /Additional department: PHYS/);
  assert.match(h.calls[0].body.location, /Teaching: no/);
  assert.equal(h.calls[0].body.websiteToken, undefined);
  await createCardDelivery(h.options).drain();
  assert.equal(h.calls.length, 4);
  const recorded = JSON.stringify([await h.state(), h.logs]);
  for (const secret of ['Test', 'test123', 'test@example.invalid', 'private-test-token', '+442079460018']) {
    assert.ok(!recorded.includes(secret));
  }
});

test('one destination failure leaves it pending and still delivers the other; term and ID survive restart', async t => {
  const h = await fixture(t);
  const fetch = h.options.fetch;
  h.options.fetch = async (url, request) => {
    if (url === backendUrl) throw new Error('private network failure');
    return fetch(url, request);
  };
  await createCardDelivery(h.options).drain();
  assert.deepEqual(h.calls.map(x => x.body.submissionID), [1311, 1312]);
  assert.deepEqual((await h.state()).dashboard.pending, { submissionID: 1311, term: '2026-fall' });
  h.options.fetch = fetch;
  h.options.term = '2027-spring';
  await createCardDelivery(h.options).drain();
  assert.deepEqual(h.calls.slice(2).map(x => [x.body.submissionID, x.body.term]), [[1311, '2026-fall'], [1312, '2027-spring']]);
  assert.equal((await h.state()).dashboard.cursor, 1312);
});

test('quarantines rejected IDs without blocking later rows; explicit retry removes successful rejection metadata', async t => {
  const h = await fixture(t);
  const fetch = h.options.fetch;
  h.options.fetch = async (url, request) => url === backendUrl && JSON.parse(request.body).submissionID === 1311
    ? { ok: true, json: async () => ({ ok: false, error: { code: 'INVALID_REQUEST', retryable: false } }) }
    : fetch(url, request);
  await createCardDelivery(h.options).drain();
  assert.equal((await h.state()).dashboard.rejected['1311'].code, 'INVALID_REQUEST');
  assert.equal((await h.state()).dashboard.cursor, 1312);
  h.options.fetch = fetch;
  await createCardDelivery(h.options).drain({ retryRejected: true });
  assert.deepEqual((await h.state()).dashboard.rejected, {});
  assert.equal(h.calls.at(-1).body.submissionID, 1311);
  assert.equal(h.calls.filter(x => x.url === legacyUrl).length, 2);
});

test('normalizes raw SQLite dates and booleans identically to Astro returning rows', async t => {
  const h = await fixture(t);
  h.rows.splice(0, h.rows.length, row(1311, { submittedAt: '2026-09-09 12:34:56', textOK: 0, card: 1, getInvolved: 1, teaching: 0, additionalDept: undefined }));
  await createCardDelivery(h.options).drain();
  const body = h.calls[1].body;
  assert.equal(body.submittedAt, '2026-09-09T12:34:56.000Z');
  assert.equal(body.additionalDept, null);
  assert.equal(body.card, true);
  assert.equal(body.teaching, false);
});

test('does not accept HTTP, auth, JSON or incomplete-refresh failures as delivered', async t => {
  for (const response of [
    { ok: false },
    { ok: true, json: async () => { throw new Error('bad JSON'); } },
    { ok: true, json: async () => ({ ok: false, error: { code: 'UNAUTHORIZED' } }) },
    { ok: true, json: async () => ({ ok: true, result: { status: 'saved', dashboardsUpdated: false } }) },
  ]) {
    const h = await fixture(t);
    const fetch = h.options.fetch;
    h.options.fetch = (url, request) => url === backendUrl ? Promise.resolve(response) : fetch(url, request);
    await createCardDelivery(h.options).drain();
    assert.equal((await h.state()).dashboard.cursor, 1310);
    assert.deepEqual((await h.state()).dashboard.rejected, {});
  }
});

test('fails closed on missing cutoff/config or corrupt progress and serializes overlapping drains', async t => {
  const h = await fixture(t);
  for (const invalid of [{ afterId: undefined }, { afterId: -1 }, { term: '' }, { backendUrl: 'https://example.invalid' }, { websiteToken: '' }]) {
    assert.throws(() => createCardDelivery({ ...h.options, ...invalid }));
  }
  const worker = createCardDelivery(h.options);
  await Promise.all([worker.drain(), worker.drain(), worker.drain()]);
  assert.equal(h.calls.length, 4);
  await writeFile(join(h.options.directory, 'progress.json'), '{broken');
  await assert.rejects(worker.drain());
  assert.equal(h.calls.length, 4);
});

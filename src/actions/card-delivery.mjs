import { mkdir, open, readFile, rename } from 'node:fs/promises';
import { join } from 'node:path';

const targets = ['legacy', 'dashboard'];
const endpoint = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
const validId = value => Number.isSafeInteger(value) && value >= 0;
const validTerm = value => /^\d{4}-(spring|fall)$/.test(value ?? '');

export function createCardDelivery(options) {
  if (!validId(options.afterId) || !validTerm(options.term) || !options.directory
    || !endpoint.test(options.legacyUrl) || !endpoint.test(options.backendUrl) || !options.websiteToken) {
    throw new Error('Card delivery configuration is incomplete');
  }
  const path = join(options.directory, 'progress.json');
  let draining;
  const report = (target, outcome, submissionID, code) => {
    try { (options.log ?? console.log)({ message: 'IGWC card delivery', target, outcome, submissionID, code }); }
    catch { /* Logging must not interrupt delivery. */ }
  };
  const checkpoint = async state => {
    await mkdir(options.directory, { recursive: true, mode: 0o700 });
    const file = await open(`${path}.tmp`, 'w', 0o600);
    try { await file.writeFile(`${JSON.stringify(state)}\n`); await file.sync(); }
    finally { await file.close(); }
    await rename(`${path}.tmp`, path);
    const directory = await open(options.directory, 'r');
    try { await directory.sync(); } finally { await directory.close(); }
  };
  const readProgress = async () => {
    let state;
    try { state = JSON.parse(await readFile(path, 'utf8')); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      state = { version: 1, afterId: options.afterId };
      for (const target of targets) state[target] = { cursor: options.afterId, pending: null, rejected: {} };
      await checkpoint(state);
    }
    if (state.version !== 1 || state.afterId !== options.afterId) throw new Error('Invalid card delivery progress');
    for (const target of targets) {
      const progress = state[target];
      if (!progress || !validId(progress.cursor) || progress.cursor < state.afterId
        || !progress.rejected || typeof progress.rejected !== 'object' || Array.isArray(progress.rejected)
        || (progress.pending && (!validId(progress.pending.submissionID)
          || progress.pending.submissionID <= progress.cursor || !validTerm(progress.pending.term)))) {
        throw new Error('Invalid card delivery progress');
      }
      for (const [id, rejected] of Object.entries(progress.rejected)) {
        if (!validId(Number(id)) || Number(id) <= state.afterId || Number(id) > progress.cursor
          || !rejected || !validTerm(rejected.term) || rejected.code !== 'INVALID_REQUEST') {
          throw new Error('Invalid rejected submission');
        }
      }
    }
    return state;
  };
  const deliver = async (target, row, term) => {
    const saved = submissionPayload(row);
    const body = target === 'legacy' ? {
      ...saved,
      otherDept: saved.dept.toUpperCase() === 'OTHER' ? saved.subfield ?? '' : '',
      location: [saved.additionalDept && `Additional department: ${saved.additionalDept}`,
        saved.additionalSubfield && `Additional subfield: ${saved.additionalSubfield}`,
        `Teaching: ${saved.teaching ? 'yes' : 'no'}`].filter(Boolean).join('; '),
    } : { ...saved, schemaVersion: 2, term, action: 'recordCard', websiteToken: options.websiteToken };
    const response = await (options.fetch ?? globalThis.fetch)(target === 'legacy' ? options.legacyUrl : options.backendUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      redirect: 'follow', signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error('HTTP failure');
    const result = await response.json();
    if (target === 'dashboard' && result?.ok === false && result.error?.code === 'INVALID_REQUEST'
      && result.error?.retryable === false) throw Object.assign(new Error('Rejected'), { permanent: true });
    if (target === 'legacy' ? result?.result !== 'success' : result?.ok !== true
      || result?.result?.dashboardsUpdated !== true
      || !['saved', 'already_applied', 'superseded'].includes(result?.result?.status)) {
      throw new Error('Delivery was not acknowledged');
    }
    // ponytail: the unchanged legacy endpoint can duplicate a row after a lost acknowledgement.
  };
  const attempt = async (target, row, term) => {
    try { await deliver(target, row, term); return 'delivered'; }
    catch (error) { return error.permanent === true ? 'rejected' : 'pending'; }
  };
  const deliverPending = async retryRejected => {
    const state = await readProgress();
    // Each destination advances independently; one failed POST cannot block the other sheet.
    for (const target of targets) {
      const progress = state[target];
      try {
        if (retryRejected) {
          for (const [id, rejected] of Object.entries(progress.rejected)) {
            const [row] = await options.loadSubmissions(Number(id) - 1, 1);
            if (row?.submissionID !== Number(id)) { report(target, 'missing', Number(id)); continue; }
            const outcome = await attempt(target, row, rejected.term);
            if (outcome === 'delivered') { delete progress.rejected[id]; await checkpoint(state); }
            report(target, outcome, Number(id));
          }
        }
        const rows = await options.loadSubmissions(progress.cursor, 50);
        if (progress.pending && rows[0]?.submissionID !== progress.pending.submissionID) {
          throw new Error('Pending submission is missing');
        }
        for (const row of rows) {
          if (!validId(row.submissionID) || row.submissionID <= progress.cursor) throw new Error('Invalid submission order');
          const pending = progress.pending ?? { submissionID: row.submissionID, term: options.term };
          progress.pending = pending;
          await checkpoint(state); // Persist the assigned term before the first POST.
          const outcome = await attempt(target, row, pending.term);
          if (outcome === 'pending') { report(target, outcome, row.submissionID); break; }
          if (outcome === 'rejected') progress.rejected[row.submissionID] = { term: pending.term, code: 'INVALID_REQUEST' };
          progress.cursor = row.submissionID;
          progress.pending = null;
          await checkpoint(state);
          report(target, outcome, row.submissionID, outcome === 'rejected' ? 'INVALID_REQUEST' : undefined);
        }
      } catch { report(target, 'pending', undefined, 'CHECKPOINT_OR_DATABASE_FAILURE'); }
    }
  };
  return {
    drain({ retryRejected = false } = {}) {
      // ponytail: a single Node process owns the checkpoint; use a shared queue before scaling replicas.
      if (!draining) draining = deliverPending(retryRejected).finally(() => { draining = undefined; });
      return draining;
    },
    start() {
      const run = retryRejected => { void this.drain({ retryRejected }).catch(() => report('queue', 'pending', undefined, 'INVALID_PROGRESS')); };
      const timer = setInterval(() => run(false), 60_000);
      timer.unref();
      run(true);
      return timer;
    },
  };
}

function submissionPayload(row) {
  const boolean = value => {
    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;
    throw Object.assign(new Error('Invalid boolean'), { permanent: true });
  };
  // SQLite CURRENT_TIMESTAMP is UTC without a suffix; Astro returns Date instances.
  const value = row.submittedAt;
  const date = new Date(typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(' ', 'T')}Z` : value);
  if (Number.isNaN(date.getTime())) throw Object.assign(new Error('Invalid signing date'), { permanent: true });
  return {
    submissionID: row.submissionID, submittedAt: date.toISOString(),
    userID: row.userID, firstName: row.firstName, lastName: row.lastName,
    email: row.email, phone: row.phone, textOK: boolean(row.textOK),
    dept: row.dept, subfield: row.subfield ?? null, card: boolean(row.card),
    contract: row.contract, year: row.year, getInvolved: boolean(row.getInvolved),
    additionalDept: row.additionalDept ?? null, additionalSubfield: row.additionalSubfield ?? null,
    teaching: boolean(row.teaching),
  };
}

# Submission sheet delivery implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver new website submissions to both the legacy card sheet and the new Sheets database, including department dashboard refreshes and term-specific SAA status.

**Architecture:** Use saved Turso submissions as the durable delivery source. One Node process polls ordered rows with independent persistent cursors for the two destinations; a versioned Apps Script request reuses the existing authenticated card receiver. Retry the same submission ID, signing timestamp and assigned term.

**Tech Stack:** Existing Astro/Drizzle, Node filesystem/fetch/test, existing Apps Script TypeScript/Vitest.

**Spec:** User instructions in this task: preserve the form and Turso, deliver to both sheets, overwrite collected profile fields, use the actual signing date, update relevant DO dashboards and SAA status, omit invalid cohort years, obtain approval before server changes.

## Global constraints

- No website form or website DB schema changes; no added dependencies.
- No production writes, server edits, or restarts during implementation.
- No production credentials or submission data in Git, logs, or tests.
- Require an explicit initial submission-ID cutoff; migration rows must not become newly signed cards.
- The operator configures the current term. Persist the term before the first database POST so retries survive a term rollover.

### Task 1: Website sender

**Files:** `src/actions/card-delivery.mjs`, `src/actions/card-delivery.test.mjs`, `src/actions/index.ts`, `src/middleware.ts`, `compose.yml`, `docs/card-delivery.md`, `.env.card-delivery.example`, `package.json`.

**Interfaces:** `createCardDelivery({loadSubmissions, directory, afterId, term, legacyUrl, backendUrl, websiteToken, fetch?, log?})` returns `{drain, start}`. `loadSubmissions(afterId, limit)` returns saved rows in ascending ID order. Version 2 POST sends the saved row fields plus `schemaVersion: 2`, `term`, `action: 'recordCard'`, and the dedicated token; dates are ISO UTC and absent optional strings become null.

- [x] Add Node tests for two-destination delivery, retry/restart without duplicates, invalid response handling, retained rejections, stable timestamp/term, and explicit migration cutoff. Example assertion: `assert.deepEqual(deliveries.map(x => x.submissionID), [1311, 1312])` after loading rows above 1310.
- [x] Run `node --test src/actions/card-delivery.test.mjs` and confirm the unimplemented helper fails.
- [x] Implement the helper with an atomic fsynced checkpoint containing cursors and rejected IDs, not member data. Isolate destination failures. Keep Turso success independent of Sheets delivery; start polling on server initialization and kick after insert.
- [x] Add private runtime environment configuration and a persistent directory mount; document activation, term changes, retries, and the legacy endpoint's unavoidable duplicate risk after a lost acknowledgement.
- [x] Run `node --test src/actions/card-delivery.test.mjs` and `ASTRO_TELEMETRY_DISABLED=1 ASTRO_DATABASE_FILE=file:/tmp/igwc-website-local.db npx astro build` (local DB only), then commit the focused website change.

### Task 2: Sheets receiver

**Files:** companion repository `src/backend/webApi.ts`, `src/backend/updateService.ts`, `src/backend/__tests__/webApi.test.ts`, existing runbook.

**Interfaces:** authenticated `recordCard` accepts legacy payloads unchanged, or version 2 saved rows with explicit `term`. It accepts international phones and the new contract enum, clears explicitly absent secondary departments, labels both subfields and contract/teaching in Details, and appends people plus term snapshots idempotently before acknowledging refreshed dashboards.

- [x] Extend existing tests with a complete v2 row and assert `dept2`, card date, Details, `saa_status`, preserved enrollment, partial-write recovery, and AC/DO projections.
- [x] Run `npx vitest run src/backend/__tests__/webApi.test.ts` to confirm the new scenarios fail.
- [x] Extend the existing receiver and update service, namespace v2 IDs separately, validate both snapshots before writing, and recover incomplete people/term writes without duplicate appends or overwriting newer submissions.
- [x] Run `npm run verify` and `npm run build:production`, then commit only the companion change. Do not deploy an older bundle over unrelated production sidebar updates.

### Task 3: Review and activation handoff

- [x] Review the complete changes against the constraints and test output; resolve important findings.
- [x] Prepare the website change for review with build/test results and the backend-first activation order.
- [ ] Ask for server activation approval only after the implementation is concrete and reviewable.

Verification: website Node tests pass (6). Local Astro build passes using a temporary SQLite database. Built-server smoke check passes: GET /card initializes polling, a local action saves one synthetic native row, both mocked endpoints receive the saved ID/date and expected v2 fields, and logs exclude credentials/contact details. Sender review found no important issues; its old-queue handoff clarification was incorporated.

Integrated review is complete. The companion receiver passes lint/typecheck, 81 Node tests, 833 Vitest tests, and both builds. Review caught and fixed same-second submission ordering after organizer edits and tightened international phone validation. Scoped re-review is clean. Website draft PR: https://github.com/IGWC/website/pull/2. Server activation remains pending approval because merging to main triggers deployment.

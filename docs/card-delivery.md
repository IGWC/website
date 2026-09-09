# Card delivery

The union-card action saves to `IGWCSubmissions`, updates the legacy Turso table, and POSTs to the legacy card sheet through `GOOGLE_SHEETS_WEBHOOK_URL`. This integration preserves those existing writes and adds delivery of saved rows to the new Sheets database. It does not modify the form or Turso schema. This needs one persistent Node process, as used by the existing Docker service.

## Configuration and activation

1. Deploy the companion Apps Script receiver with support for `schemaVersion: 2` before enabling this sender. It must accept the new fields and `term`, write profile and SAA snapshots, refresh AC and affected DO dashboards, and acknowledge `dashboardsUpdated: true`.
2. Copy `.env.card-delivery.example` into the private server file `../data/card-delivery.env`, supply the new backend `/exec` URL and dedicated website token. Keep the existing `GOOGLE_SHEETS_WEBHOOK_URL` configuration in place for the legacy POST. Keep this file mode 600 and outside Git. Set the dedicated website token, not a dashboard access token.
3. Set `IGWC_CARD_SYNC_AFTER_ID` to the **last migration row**, after verifying the boundary against the saved submissions. Do not use the latest row automatically: that could skip real cards submitted since migration. Do not replay migration rows: their migration timestamp is not their signing date. Zero is only appropriate for a known empty/synthetic database.
4. Set `IGWC_CARD_TERM` to the dashboard's current term (`YYYY-fall` or `YYYY-spring`), and enable `IGWC_CARD_DELIVERY_ENABLED=true`. The term is recorded before a row's first POST; retries retain it. Before changing terms, drain the old backlog and review any rejected rows. Rows not yet attempted use the newly configured term.
5. Preserve the prior `../data/card-delivery/` queue. Reconcile any remaining entries before activation: this worker cannot see a legacy queue entry whose Turso write never completed. Do not run both workers for the same submissions.
6. After approval for server changes, rebuild/recreate only `astro-website`. Compose mounts `../data/card-delivery-v2` for progress; keep it across deploys and back it up. The website DB credentials remain runtime environment variables, with only the remote URL used at build time.
7. GET `/card` as the readiness check after restart. Astro loads middleware on the first request, starting the poller. It also kicks after each new Turso insert and polls every minute, up to 50 new rows each pass. Verify the cursor and affected dashboards for a real submission; do not submit fake production cards.

No database tables are dropped, cleared, or migrated by this integration. Disabling this delivery worker stops forwarding to the new database while the existing Turso and legacy Sheet writes continue; re-enabling resumes from the saved progress.

## Delivery and recovery

`progress.json` stores the new database cursor, the currently pending ID/term, and rejected IDs/terms. It contains no names, contact information, or tokens. Invalid or unreadable progress stops delivery rather than guessing a cursor. The original cutoff must remain unchanged when resuming an existing file.

Transient HTTP, authorization, parse, and incomplete dashboard-refresh failures remain pending. A permanent `INVALID_REQUEST` is retained under `rejected` while later rows proceed. Fix the adapter/receiver, then restart and GET `/card` to retry rejected rows. A successful retry removes that rejection entry; the source row remains in Turso. Do not edit an already-acknowledged submission and reuse its ID: the receiver rejects changed payloads under the same ID. Correct member information through the dashboard or a new submission instead.

Logs contain only destination, outcome, submission ID, and fixed error codes. Check the cursor against the latest native submission ID and inspect retained rejections; a successful form submission means Turso saved it, not that both Sheets writes have already finished. Never delete or reset progress just to retry a row.

The new receiver deduplicates by native submission ID. Retries from this worker target only the new database; they never resend the existing legacy POST. The existing legacy delivery remains best effort: it checks HTTP status and logs failures, without this worker adding retries or changing its behavior.

## Field mapping

| Website row | New database |
| --- | --- |
| `userID` | Normalized IU username |
| `firstName`, `lastName`, `email`, `phone` | Profile fields, including international phone strings |
| `textOK`, `getInvolved` | Explicit yes/no values, including false |
| `dept`, `additionalDept` | Primary/secondary department; an absent additional department clears the old value |
| `subfield`, `additionalSubfield`, `contract`, `teaching` | Labeled Details; OTHER text is retained |
| Valid `year` | Cohort year; invalid values are omitted |
| `submittedAt`, `card: true` | Actual signing date; clears card refusal |
| `contract` + configured `term` | `saa` becomes SAA=yes; fellowship/hourly/none become SAA=no. Enrollment is preserved. Teaching does not establish an official appointment type. |

The existing `toLegacySubmission` adapter and legacy POST remain unchanged. The complete native row remains in Turso.

## Local checks

```sh
npm ci
npm test
ASTRO_TELEMETRY_DISABLED=1 ASTRO_DATABASE_FILE=file:/tmp/igwc-website-local.db npx astro build
```

Keep delivery disabled for builds and ordinary local development. Tests use temporary progress directories, synthetic rows, and mocked HTTP; they do not contact Sheets or production Turso. The helper's `drain({ retryRejected: true })` is also available to a controlled server-side caller using the same database loader and private configuration; never run a second worker against the same progress file while the website process is running.

# Verification Checklist

> Purpose: convert every **❓ UNKNOWN** and **⚠️ Inferred** item from the audit into a concrete, runnable test. Each item has:
>
> - **ID** — reference code.
> - **What we're verifying** — the open question.
> - **How to test** — exact steps.
> - **Expected result** — what "correct" looks like.
> - **Evidence to capture** — what to paste into a change ticket.
> - **Pass / Fail** — tick boxes.
> - **If it fails** — what it means and where to look.
>
> Run this checklist **before** going live with a real clinic. Treat every unverified ❓ as a risk until proven otherwise. Do not mark an item ✅ without captured evidence.

---

## How to Use This Document

1. Copy this file into your ops runbook.
2. Execute items in order — later items depend on earlier ones.
3. Every item must end with **PASS**, **FAIL**, or **BLOCKED** (with a reason).
4. For every FAIL, open a ticket referencing the finding IDs from `AUDIT_FINDINGS.md` (e.g. `H1`, `M9`).
5. Store evidence (screenshots, log excerpts, SQL output) with the ticket.

**Environment:** run against a **staging** instance that mirrors production, never against production data.

---

## Phase A — Environment & Boot

### A1. Backend boots cleanly

- **Question:** Does the backend start without runtime errors on a fresh `.env`?
- **Steps:**
  1. `cd backend && npm run dev`
  2. Watch stdout for the first 30 seconds.
  3. `curl -i http://localhost:3000/health`
- **Expected:** HTTP 200 with a small JSON or text body; no unhandled promise rejections in stdout.
- **Evidence:** stdout excerpt + curl output.
- **Pass ☐ / Fail ☐**
- **If it fails:** check `DATABASE_URL`, `PORT`, and any missing env var the process complains about.

### A2. Database migrations apply from zero

- **Question:** Do `prisma migrate deploy` and `prisma db seed` run on an empty database without manual intervention?
- **Steps:**
  1. Create a fresh DB (e.g. `physio_z_verify`).
  2. Point `DATABASE_URL` at it.
  3. `npx prisma migrate deploy`
  4. `npx prisma db seed`
- **Expected:** both commands exit 0; no drift warnings.
- **Evidence:** command output.
- **Pass ☐ / Fail ☐**
- **If it fails:** the migration history is broken — treat as a critical blocker.

### A3. Seed behaviour is understood

- **Question (❓):** What exactly does `backend/prisma/seed.ts` create? Is it idempotent?
- **Steps:**
  1. Run the seed once. Query the DB:
     - `SELECT * FROM "User";`
     - `SELECT * FROM "Settings";`
     - `SELECT COUNT(*) FROM "Exercise";`
  2. Run the seed a **second time**.
  3. Re-run the queries.
- **Expected:** Seed creates an OWNER user; you know whether it creates a `Settings` row and imports exercises; second run does not throw or duplicate rows.
- **Evidence:** before/after row counts + the seed's console output.
- **Pass ☐ / Fail ☐**
- **If it fails / if seed is not idempotent:** document a manual seed procedure in the runbook; do not let it run twice in production.

### A4. Frontend build succeeds

- **Question:** Does `pnpm build` complete without errors on a clean checkout?
- **Steps:**
  1. `cd frontend && pnpm install --frozen-lockfile`
  2. `pnpm build`
- **Expected:** exit 0; `dist/` produced.
- **Evidence:** build log tail.
- **Pass ☐ / Fail ☐**
- **If it fails:** capture the exact error — it means the app cannot be deployed.

### A5. Backend TypeScript build succeeds

- **Question:** Does `npm run build` (tsc) compile cleanly?
- **Steps:**
  1. `cd backend && npm run build`
- **Expected:** exit 0; `dist/` produced.
- **Evidence:** build log.
- **Pass ☐ / Fail ☐**
- **Note:** if the backend runs via `tsx` in production, `tsc` errors still indicate latent type bugs.

### A6. CORS works from the real frontend origin

- **Question:** Does the frontend origin exactly match `CORS_ORIGIN`?
- **Steps:**
  1. Open the frontend in a browser.
  2. Open DevTools → Network → login request.
  3. Confirm no CORS error; `Access-Control-Allow-Origin` equals the frontend origin.
- **Expected:** request succeeds.
- **Evidence:** DevTools screenshot.
- **Pass ☐ / Fail ☐**

---

## Phase B — Authentication & Authorization

### B1. Staff login works for every role

- **Question:** Can OWNER, SECRETARY, and THERAPIST each log in and reach their dashboard?
- **Steps:** log in once per role.
- **Expected:** dashboard loads; role-appropriate sidebar visible.
- **Evidence:** screenshot per role.
- **Pass ☐ / Fail ☐**

### B2. Refresh token flow works

- **Question:** Does the client silently refresh an expired access token?
- **Steps:**
  1. Log in.
  2. In DevTools → Application → Local Storage, wait until `accessToken` expires (or set `JWT_ACCESS_EXPIRES=30` temporarily).
  3. Perform an action (open Patients).
- **Expected:** a `POST /api/auth/refresh` is fired; the action succeeds without re-login.
- **Evidence:** Network screenshot.
- **Pass ☐ / Fail ☐**

### B3. Invalid / tampered token is rejected

- **Question:** Does `requireAuth` reject a modified token?
- **Steps:**
  1. Log in, copy `accessToken`.
  2. Change the last 4 characters.
  3. `curl -H "Authorization: Bearer <tampered>" http://localhost:3000/api/patients`
- **Expected:** HTTP 401.
- **Evidence:** curl output.
- **Pass ☐ / Fail ☐**

### B4. Refresh token cannot be used as access token

- **Question:** Does `requireAuth` enforce `type: 'access'`?
- **Steps:**
  1. Log in, copy `refreshToken`.
  2. `curl -H "Authorization: Bearer <refreshToken>" http://localhost:3000/api/patients`
- **Expected:** HTTP 401.
- **Evidence:** curl output.
- **Pass ☐ / Fail ☐**

### B5. Role enforcement on `/api/users` **(❓ / AUDIT-H)** 

- **Question:** Do `/api/users` routes enforce `requireRole('OWNER')`?
- **Steps:**
  1. Log in as SECRETARY; capture token.
  2. `curl -H "Authorization: Bearer <sec-token>" http://localhost:3000/api/users`
  3. Repeat: `POST /api/users` with a body creating a dummy user.
  4. Repeat steps for THERAPIST.
- **Expected:** HTTP 403 for both non-OWNER roles on all verbs.
- **Evidence:** curl output for each role/verb.
- **Pass ☐ / Fail ☐**
- **If it fails:** **this is a privilege-escalation blocker.** Do not go live.

### B6. Role enforcement on `/api/settings` **(❓ / AUDIT-H)**

- **Steps:**
  1. Log in as SECRETARY.
  2. `curl -X PATCH -H "Authorization: Bearer <sec-token>" -H "Content-Type: application/json" -d '{"centerName":"x"}' http://localhost:3000/api/settings`
- **Expected:** HTTP 403.
- **Evidence:** curl output.
- **Pass ☐ / Fail ☐**
- **If it fails:** a non-owner can rename the clinic or change pricing — blocker.

### B7. IDOR on `GET /api/appointments/:id` **(AUDIT-H2)**

- **Question:** Can a PATIENT fetch another patient's appointment by ID?
- **Steps:**
  1. Create patient A with appointment X, patient B with appointment Y.
  2. Log in as patient A's portal user.
  3. `curl -H "Authorization: Bearer <A-token>" http://localhost:3000/api/appointments/<Y-id>`
- **Expected:** HTTP 403 or 404.
- **Evidence:** curl output.
- **Pass ☐ / Fail ☐**
- **If it fails:** IDOR confirmed — fix before go-live.

### B8. IDOR on `GET /api/patients/:id` **(AUDIT-H2)**

- **Steps:** as B7, but for `/api/patients/<other-id>` with a PATIENT-role token.
- **Expected:** HTTP 403 or 404.
- **Evidence:** curl output.
- **Pass ☐ / Fail ☐**

### B9. Patient portal isolation

- **Question:** Can a patient portal token access staff-only endpoints?
- **Steps:**
  1. Obtain a portal token.
  2. `curl -H "Authorization: Bearer <portal-token>" http://localhost:3000/api/users`
  3. Repeat for `/api/settings`, `/api/audit`, `/api/backups`.
- **Expected:** HTTP 403 or 401 everywhere.
- **Evidence:** curl output.
- **Pass ☐ / Fail ☐**

### B10. Logout truly invalidates the session **(❓)**

- **Question:** Does logout invalidate the refresh token server-side, or is it purely client-side?
- **Steps:**
  1. Log in; copy `refreshToken`.
  2. Log out via the UI.
  3. `curl -X POST -H "Content-Type: application/json" -d '{"refreshToken":"<copied>"}' http://localhost:3000/api/auth/refresh`
- **Expected (interpreted):** If the implementation is stateless (per audit), this will still succeed — meaning logout is **client-side only** and a stolen refresh token remains valid until it expires.
- **Evidence:** curl output + inspection of `auth.controller.logout`.
- **Pass ☐ / Fail ☐**
- **If it fails (i.e. token still works):** document the limitation; consider a server-side token blacklist.

---

## Phase C — Patient Portal

### C1. OTP delivery channel **(❓)**

- **Question:** How is the OTP actually delivered? SMS? WhatsApp? Email? Console in dev?
- **Steps:**
  1. Request an OTP for a test patient.
  2. Watch: backend stdout, the patient's email inbox, the patient's phone, and the `WhatsAppReminderLog` / notification tables.
  3. If nothing arrives, grep the codebase for where the OTP is generated and sent: `grep -rn "otp" backend/src`.
- **Expected:** you identify and document the exact channel; the OTP arrives within the expected window.
- **Evidence:** screenshot of the received OTP + code path.
- **Pass ☐ / Fail ☐**
- **If it fails:** the portal cannot be used by real patients. Block go-live for the portal.

### C2. OTP expiry and rate limiting

- **Steps:**
  1. Request OTP; wait beyond the assumed expiry (check code).
  2. Try to use it.
  3. Request OTP 10 times in a row.
- **Expected:** expired OTP is rejected; rate limit kicks in and returns 429.
- **Evidence:** curl output.
- **Pass ☐ / Fail ☐**

### C3. Patient self-registration notifies staff **(⚠️ Inferred)**

- **Question:** Does registering a new patient really notify SECRETARY + OWNER?
- **Steps:**
  1. Register a new patient via `/register`.
  2. Log in as SECRETARY, watch the notification bell.
- **Expected:** a notification appears for the new registration.
- **Evidence:** screenshot.
- **Pass ☐ / Fail ☐**

### C4. Patient self-booking respects capacity

- **Steps:** as a portal user, book when the global cap is already reached.
- **Expected:** HTTP 409 with a clear message.
- **Evidence:** screenshot.
- **Pass ☐ / Fail ☐**

---

## Phase D — Appointments & Clinical

### D1. Therapist concurrency rule (max 2)

- **Steps:** create 2 overlapping appointments for one therapist; attempt a 3rd.
- **Expected:** 3rd returns 409.
- **Evidence:** curl output.
- **Pass ☐ / Fail ☐**

### D2. Global room cap

- **Steps:** set `maxConcurrentRooms` to 2 in Settings. Create 2 overlapping appointments (different therapists). Attempt a 3rd.
- **Expected:** 3rd returns 409.
- **Evidence:** curl output.
- **Pass ☐ / Fail ☐**

### D3. Room availability

- **Steps:** book room R at 10:00. Book room R again at 10:00.
- **Expected:** second request returns 409.
- **Evidence:** curl output.
- **Pass ☐ / Fail ☐**

### D4. Recurring appointments **(❓ / AUDIT-Gap)**

- **Question:** Is `RecurringPattern` actually used end-to-end?
- **Steps:**
  1. `grep -rn "RecurringPattern" backend/src frontend/src`
  2. In the UI, look for a "recurring" toggle when creating an appointment.
  3. If found, create a weekly pattern and verify multiple appointments appear.
- **Expected:** either the feature works end-to-end, or it clearly does not exist in the UI.
- **Evidence:** code grep + UI screenshot.
- **Pass ☐ / Fail ☐**
- **If it fails:** mark as "Not implemented in UI" in `FEATURES.md` and `KNOWN_LIMITATIONS.md`.

### D5. Session note → rating → effectiveness pipeline

- **Steps:** complete an appointment, write a session note with a pain level, have the patient submit a rating, then open Treatment Effectiveness in Intelligence.
- **Expected:** the session and rating appear in the report.
- **Evidence:** screenshots.
- **Pass ☐ / Fail ☐**

---

## Phase E — Billing

### E1. Tax and totals

- **Steps:** set `taxRate=14` in Settings. Create an invoice with amount 100.
- **Expected:** `tax = 14`, `total = 114`.
- **Evidence:** invoice screenshot + DB row.
- **Pass ☐ / Fail ☐**

### E2. Partial payment status transitions

- **Steps:** create invoice total 100. Add payment 40; then 60.
- **Expected:** status → `PARTIALLY_PAID` → `PAID`.
- **Evidence:** invoice screenshots.
- **Pass ☐ / Fail ☐**

### E3. Invoice PDF

- **Steps:** download a PDF for a real invoice.
- **Expected:** PDF opens; values match the invoice.
- **Evidence:** PDF file.
- **Pass ☐ / Fail ☐**

---

## Phase F — Integrations

### F1. WhatsApp reminder is sandbox **(AUDIT-M10 / ❓)**

- **Question:** Does "send reminder" actually send a WhatsApp message?
- **Steps:**
  1. Configure a WhatsApp provider (if you have real credentials).
  2. Send a reminder for an appointment.
  3. Watch: recipient phone, backend stdout, `WhatsAppReminderLog` table.
  4. `grep -rn "whatsapp" backend/src/services`
- **Expected:** either a real message is delivered, **or** the code clearly logs/simulates.
- **Evidence:** grep output + observed result.
- **Pass ☐ / Fail ☐**
- **If it's simulated:** mark the feature **Placeholder** in `FEATURES.md`. Do not promise patients automated WhatsApp reminders.

### F2. Payment gateway is live or simulated **(AUDIT-M10 / ❓)**

- **Steps:** as F1, for `payment-gateway.service.ts`. Attempt a test charge in the provider's sandbox; check whether an HTTP call is actually made.
- **Expected:** you can state definitively "live" or "manual/reference-only".
- **Evidence:** grep + provider sandbox logs.
- **Pass ☐ / Fail ☐**

### F3. Backup produces a real dump **(AUDIT-M9 / ❓)**

- **Steps:**
  1. Create a backup via the Backups module.
  2. Inspect the `BackupRecord` row: is there a real file path, size, and timestamp?
  3. Look on disk / in DB: does a dump exist?
  4. Restore into a scratch DB.
- **Expected:** either a real, restorable dump is produced, or the module is metadata-only.
- **Evidence:** DB row + file listing + restore attempt.
- **Pass ☐ / Fail ☐**
- **If metadata-only:** document loudly; provision `pg_dump` externally.

### F4. Video consultation stores a working link

- **Steps:** create a video consultation with a Zoom/Meet link; open it from the patient portal.
- **Expected:** link opens the external meeting.
- **Evidence:** screenshot.
- **Pass ☐ / Fail ☐**

### F5. Provider credentials are actually encrypted **(❓)**

- **Question:** Is `ServiceProvider.credentials` encrypted at rest, or just stored as JSON?
- **Steps:** create a provider with a known test credential. Query the row directly in PostgreSQL.
- **Expected:** you can see whether the value is plaintext or ciphertext.
- **Evidence:** SQL output (redact the value).
- **Pass ☐ / Fail ☐**
- **If plaintext:** treat as a **High** security finding.

---

## Phase G — Notifications, Audit, Files

### G1. SSE notifications arrive in real time

- **Steps:** open two browsers (staff A, staff B). Have A create a patient; watch B's bell.
- **Expected:** B's bell updates without refresh.
- **Evidence:** screen recording or two screenshots.
- **Pass ☐ / Fail ☐**

### G2. Audit log captures sensitive actions

- **Steps:** create/update/delete a patient; log in and out; change Settings.
- **Expected:** corresponding `AuditLog` rows with action, entity, user, timestamp.
- **Evidence:** Audit module screenshot + SQL.
- **Pass ☐ / Fail ☐**

### G3. File upload validation

- **Steps:** try uploading: (a) a normal PDF, (b) a 50 MB file, (c) a `.exe` renamed to `.pdf`.
- **Expected:** (a) succeeds; (b) rejected with a size error; (c) rejected by MIME/magic-byte check.
- **Evidence:** screenshots.
- **Pass ☐ / Fail ☐**
- **If (c) succeeds:** **security finding** — see `SECURITY_AUDIT.md` M2.

### G4. File storage growth

- **Steps:** upload a 5 MB image. Check DB row size for `File.data`.
- **Expected:** the row is ~6.7 MB (base64 overhead). Confirm you understand the growth model.
- **Evidence:** `SELECT pg_column_size(data) FROM "File" ...`.
- **Pass ☐ / Fail ☐**

---

## Phase H — Testing & CI

### H1. Test suite actually runs **(AUDIT-C2)**

- **Steps:** `cd backend && npm test` and `cd frontend && npx vitest run`.
- **Expected:** tests execute. Record: pass count, fail count, duration.
- **Evidence:** terminal output.
- **Pass ☐ / Fail ☐**
- **If it fails:** this is a **Critical** finding — CI cannot be added meaningfully until tests run.

### H2. Coverage is measurable **(AUDIT-C2)**

- **Steps:** `npm run test:cov`.
- **Expected:** a coverage report is produced.
- **Evidence:** coverage summary.
- **Pass ☐ / Fail ☐**

### H3. No CI pipeline exists **(AUDIT-C1)**

- **Steps:** `find . -path ./node_modules -prune -o -name '*.yml' -print | grep -E 'github|gitlab|circle'`
- **Expected:** to confirm the audit's finding — no pipeline.
- **Evidence:** command output.
- **Pass ☐ (as expected) / Fail ☐**
- **Note:** "Pass" here means the audit was accurate. The remediation is in `REMEDIATION_PLAN.md` §Phase 1.

---

## Phase I — Multi-Instance & Rate Limiting

### I1. Rate limit is per-instance **(AUDIT-H1)**

- **Steps:**
  1. Start two backend instances on different ports behind a simple round-robin proxy.
  2. Fire 100 login attempts alternating across both.
- **Expected:** you observe that limits are counted separately per instance.
- **Evidence:** request log.
- **Pass ☐ / Fail ☐**
- **If confirmed:** this is expected per the audit; remediation is Redis-backed rate limiting.

---

## Phase J — Secrets & Configuration

### J1. No default secrets remain

- **Steps:** `grep -rE "change_me|ChangeMe123|01000000000" backend/.env backend/src`
- **Expected:** no hits in `.env` or `src` for the default secrets (only in `.env.example` and seed docs).
- **Evidence:** grep output.
- **Pass ☐ / Fail ☐**

### J2. JWT secrets are long and random

- **Steps:** `grep -E "JWT_(ACCESS|REFRESH)_SECRET" backend/.env`; check length ≥ 32 chars, high entropy.
- **Expected:** both pass.
- **Evidence:** (redact the actual value) length + entropy notes.
- **Pass ☐ / Fail ☐**

### J3. Production `NODE_ENV` is set

- **Steps:** confirm `NODE_ENV=production` on the prod instance.
- **Expected:** confirmed; error verbosity matches.
- **Evidence:** env dump (redacted).
- **Pass ☐ / Fail ☐**

---

## Sign-Off

| Area | Owner | Date | Result |
|------|-------|------|--------|
| Environment & Boot | | | |
| Auth & AuthZ | | | |
| Patient Portal | | | |
| Appointments & Clinical | | | |
| Billing | | | |
| Integrations | | | |
| Notifications / Audit / Files | | | |
| Testing & CI | | | |
| Rate Limiting | | | |
| Secrets | | | |

**Go / No-Go decision:** ☐ Go ☐ No-Go

**If No-Go:** list every FAIL with its ticket ID below and block release until closed.

# Remediation Plan

> A prioritised, expert-authored plan to close **every** finding from `AUDIT_FINDINGS.md` — Critical, High, Medium, Low — plus the ❓ unknowns surfaced by `VERIFICATION_CHECKLIST.md`.
>
> **Rules for this plan:**
> - It changes **nothing** in the repository by itself. It is a plan.
> - No code has been modified during the audit or in this document.
> - Each item lists: **ID · Severity · Effort · Dependencies · Fix approach · Acceptance test · Evidence**.
> - Effort is expressed in engineer-days (1 ED ≈ 1 focused day by one engineer familiar with the stack).
> - Order matters: **Phase 0 → Phase 4**. Do not jump ahead.

---

## Executive Summary

The codebase is functional and well-structured but has **five security/reliability blockers** (H1–H5), **two critical process gaps** (C1–C2), and **a long tail of medium/low issues**. The plan below fixes all of them in four phases:

| Phase | Theme | Closes | Total effort |
|-------|-------|--------|--------------|
| **0** | Stop-the-bleeding (security) | H2, H3, H5, M8 (partial) | 2–3 ED |
| **1** | Foundations (CI, tests, logging) | C1, C2, M3 | 6–9 ED |
| **2** | Security hardening | H1, H4, M1, M2, M4, F5, G3 | 5–8 ED |
| **3** | Feature honesty & resilience | M9, M10, F1–F3, D4, L1–L6 | 6–10 ED |
| **4** | Long-term / architectural | M5, M6, M7, L7, L8, multi-tenancy (if needed) | 10+ ED |

**Total:** ~30–45 engineer-days for a defensible production posture, excluding optional multi-tenancy work.

---

## Phase 0 — Stop-the-Bleeding (Do This First)

**Goal:** close the findings that expose data or allow privilege escalation. These are the only items that must be done before any real clinic data touches the system.

### 0.1 — Fix IDOR on retrieval endpoints (`AUDIT-H2`, `B7`, `B8`)

- **Severity:** High
- **Effort:** 0.5 ED
- **Location:** `backend/src/controllers/appointment.controller.ts` (`getById`), `backend/src/controllers/patient.controller.ts` (`getById`)
- **Root cause:** `getById` handlers retrieve by `req.params.id` without checking that the caller is entitled to that record.
- **Fix approach (pattern, not code):**
  1. In `appointment.controller.getById`: after fetching the appointment, if `req.userRole === 'PATIENT'`, resolve the caller's `patientId` (via `User.patient` relation) and compare to `appointment.patientId`. Mismatch → `404` (prefer 404 over 403 to avoid ID enumeration).
  2. Same rule in `patient.controller.getById`: PATIENT may only read their own `Patient` row.
  3. Apply the same ownership check to **every** `getById`, `update`, `delete` handler in the repo. Grep: `grep -rn "params.id" backend/src/controllers`.
  4. Consider extracting a helper `assertOwnership(role, entity, patientId)` to avoid drift.
- **Acceptance test:** checklist items **B7** and **B8** pass.
- **Evidence:** updated controller diff + curl transcripts showing 404 for cross-patient access.

### 0.2 — Rotate JWT secrets and owner credentials (`AUDIT-H3`, `AUDIT-H5`, `J1`, `J2`)

- **Severity:** High
- **Effort:** 0.5 ED
- **Location:** `backend/.env.example`, deployment env
- **Fix approach:**
  1. Generate strong secrets: `openssl rand -hex 64` for both `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
  2. Force a different `OWNER_PASSWORD` in every environment.
  3. Add a **startup guard** in `backend/src/app.ts` (or `env.ts`): if `NODE_ENV === 'production'` and any of `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` equals `change_me` (or is < 32 chars), **throw and refuse to start**.
  4. Keep `.env.example` as-is (it is documentation) but add a comment banner: `# CHANGE EVERYTHING BELOW BEFORE DEPLOYING`.
- **Acceptance test:** starting the backend with `NODE_ENV=production` and `JWT_ACCESS_SECRET=change_me` fails with a clear message.
- **Evidence:** startup log showing refusal.

### 0.3 — Verify and lock down `/api/users` and `/api/settings` (`AUDIT-B5`, `AUDIT-B6`)

- **Severity:** High (blocker if unguarded)
- **Effort:** 0.5 ED
- **Location:** `backend/src/routes/user.routes.ts`, `backend/src/routes/settings.routes.ts`
- **Fix approach:**
  1. First run checklist **B5** and **B6** to confirm the exposure.
  2. If unguarded, add `requireRole('OWNER')` to every verb on those routers.
  3. Apply the same review to `/api/audit`, `/api/backups`, `/api/providers` — these should be OWNER-only.
  4. Create a **route-authorisation matrix** (see table below) and enforce it in code.

| Route group | Minimum role |
|-------------|--------------|
| `/api/users` | OWNER |
| `/api/settings` | OWNER |
| `/api/audit` | OWNER |
| `/api/backups` | OWNER |
| `/api/providers` | OWNER |
| `/api/reports` | OWNER, SECRETARY |
| `/api/patients`, `/api/appointments`, `/api/invoices` | OWNER, SECRETARY, THERAPIST |
| `/api/portal/*` | PATIENT_PORTAL |
| `/api/patient-auth/*` | Public (OTP) |

- **Acceptance test:** checklist **B5**, **B6**, **B9** pass.
- **Evidence:** route diff + curl transcripts.

### 0.4 — Freeze and back up before touching anything else

- **Effort:** 0.5 ED
- **Steps:**
  1. `pg_dump` the current database to a safe location.
  2. Tag the current commit: `git tag pre-remediation`.
  3. Confirm the tag and dump are recoverable.
- **Why:** Phase 1 and beyond will change code; you want a known-good rollback.

**Phase 0 exit criteria:** B5, B6, B7, B8, B9 pass; J1, J2 pass; secret rotation performed; rollback artefact exists.

---

## Phase 1 — Foundations (CI, Tests, Logging)

**Goal:** make the repo verifiable. Without this phase, no future fix can be trusted.

### 1.1 — Establish CI (`AUDIT-C1`, `H3`)

- **Severity:** Critical
- **Effort:** 1 ED
- **Fix approach (GitHub Actions, since repo is on GitHub):**
  1. Create `.github/workflows/ci.yml`.
  2. Jobs:
     - **backend-lint**: `npm ci && npm run lint` (add ESLint if missing).
     - **backend-typecheck**: `npm ci && npx tsc --noEmit`.
     - **backend-test**: spin up a PostgreSQL service container; run `prisma migrate deploy`; run `npm test`.
     - **frontend-lint**: `pnpm install --frozen-lockfile && pnpm lint`.
     - **frontend-typecheck**: `pnpm tsc --noEmit`.
     - **frontend-test**: `pnpm vitest run`.
     - **frontend-build**: `pnpm build`.
  3. Require all jobs to pass before merge to `main`.
  4. Add a status badge to the root `README.md`.
- **Acceptance test:** opening a draft PR triggers all jobs; a deliberately failing test blocks merge.
- **Evidence:** CI run URL.

### 1.2 — Make the test suite runnable and meaningful (`AUDIT-C2`, `H1`, `H2`)

- **Severity:** Critical
- **Effort:** 3–5 ED
- **Fix approach:**
  1. Run `npm test` (backend) and `vitest run` (frontend). Triage every failure.
  2. Add a `test` script to the root `package.json` that runs both.
  3. Configure coverage thresholds in `jest.config.cjs` and Vitest config:
     - Start with **global 40% lines** to prevent regression.
     - Ratchet to 60% over three sprints.
  4. Write tests for **critical paths only first** (in this order):
     - `auth.service.login` — success, wrong password, inactive user, unknown user.
     - `auth.service.refresh` — valid, expired, tampered.
     - `auth.service.changePassword` — strength rules, current-password check.
     - `checkTherapistConcurrency` — 0/1/2 existing, overlapping vs. adjacent.
     - `checkGlobalConcurrency` — under/at/over cap.
     - `checkRoomAvailability` — free/occupied.
     - `appointment.controller.getById` — own vs. cross-patient (post-Phase 0).
     - `invoice` totals with tax and discount.
     - OTP request → verify → token issue.
  5. Add one E2E happy-path test (login → patient → appointment → invoice → payment) using `supertest`.
- **Acceptance test:** `npm test` passes locally and in CI; coverage report published as an artefact.
- **Evidence:** CI artefact + coverage summary.

### 1.3 — Structured logging (`AUDIT-M3`)

- **Severity:** Medium
- **Effort:** 1–2 ED
- **Fix approach:**
  1. Introduce `pino` (or `winston`) in `backend/src/lib/logger.ts`.
  2. Replace `console.error` in `errorHandler.ts` with `logger.error({ err, reqId }, 'unhandled')`.
  3. Add a request-ID middleware (`crypto.randomUUID()`) and attach to every log line.
  4. Log at INFO for request-in, WARN for 4xx, ERROR for 5xx.
  5. Redact known-sensitive fields: `password`, `passwordHash`, `token`, `refreshToken`, `Authorization`.
  6. In production, output JSON; in dev, pretty-print.
  7. Ship logs to your aggregator (Loki, Datadog, etc.) — decide based on hosting.
- **Acceptance test:** an unhandled error produces a structured JSON line with request ID and no secrets.
- **Evidence:** log sample.

### 1.4 — ESLint + Prettier baseline

- **Effort:** 1 ED
- **Fix approach:** add ESLint config with rules for `no-unused-vars`, `no-floating-promises`, `@typescript-eslint/no-explicit-any` (warn), and enable it in CI. Prettier config for consistency.
- **Acceptance test:** CI lint job passes on `main`.
- **Why:** this catches H/M/L issues (dead code, unused imports, unsafe promises) before review.

**Phase 1 exit criteria:** CI green on `main`; coverage measured; error logs are structured and redacted.

---

## Phase 2 — Security Hardening

### 2.1 — Redis-backed rate limiting (`AUDIT-H1`, `I1`)

- **Severity:** High
- **Effort:** 1–2 ED
- **Fix approach:**
  1. Provision Redis (managed or self-hosted).
  2. Add `rate-limit-redis` and configure `express-rate-limit` to use a Redis store in `backend/src/middleware/rateLimiter.ts`.
  3. Set distinct limits:
     - `loginLimiter`: 5 / 15 min / IP.
     - `registerLimiter`: 3 / hour / IP.
     - `sensitiveOpLimiter`: 20 / hour / user.
     - `apiLimiter`: 300 / 15 min / user+IP.
  4. Add `trust proxy` correctly so limits key on the real client IP behind the reverse proxy.
  5. For the patient OTP flow, key on **phone number + IP** to avoid punishing shared IPs.
- **Acceptance test:** checklist **I1** no longer bypasses; limits hold across two instances.
- **Evidence:** two-instance test transcript.

### 2.2 — Token storage hardening (`AUDIT-H4`)

- **Severity:** High
- **Effort:** 2–3 ED
- **Fix approach (in order of robustness):**
  1. **Preferred:** move **refresh token** to an `httpOnly; Secure; SameSite=Strict` cookie. Keep the short-lived access token in memory (React context / Zustand, not persisted).
  2. On app load, call `POST /api/auth/refresh` (cookie-based) to get a fresh access token.
  3. Add CSRF protection (double-submit token) **only because** the refresh cookie is now sent automatically — see 2.3.
  4. If a cookie is not feasible (e.g. cross-domain frontend/backend), keep tokens in memory and add **strict CSP** + short access TTL as a partial mitigation, and document the residual risk.
- **Acceptance test:** no `refreshToken` in `localStorage`; login survives page reload via silent refresh; B2 still passes.
- **Evidence:** DevTools Application tab screenshot.

### 2.3 — CSRF protection (`AUDIT-M1`)

- **Severity:** Medium (becomes High once cookies are used)
- **Effort:** 1 ED
- **Fix approach:** with cookie-based refresh (2.2), add `csrf-csrf` or `csurf`-equivalent:
  - Issue a CSRF token as a non-`httpOnly` cookie readable by the frontend.
  - Require `X-CSRF-Token` header on every state-changing request.
  - Exempt only `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/patient-auth/*`.
- **Acceptance test:** a state-changing request without the header returns 403.
- **Evidence:** curl transcripts.

### 2.4 — File upload validation (`AUDIT-M2`, `G3`)

- **Severity:** Medium (High if arbitrary files can be served back)
- **Effort:** 1–2 ED
- **Fix approach:**
  1. Enforce **max size** at the `multer` layer (e.g. 10 MB).
  2. Validate **MIME by magic bytes** (use `file-type`), not just `Content-Type`.
  3. Whitelist types per context: e.g. images for progress photos, PDFs for consent forms.
  4. For image uploads, run through `sharp` and re-encode (strips EXIF, neutralises embedded payloads).
  5. Never serve files with a user-controlled content type; force `Content-Disposition: attachment` when appropriate.
  6. Reject double extensions (`file.pdf.exe`).
- **Acceptance test:** checklist **G3** passes.
- **Evidence:** upload transcripts.

### 2.5 — Remove or protect Swagger UI (`AUDIT-M4`)

- **Severity:** Low-Medium
- **Effort:** 0.5 ED
- **Fix approach:** mount Swagger behind `requireRole('OWNER')` and `NODE_ENV !== 'production'`, or gate it behind basic auth at the reverse proxy. Many teams prefer to keep it but only on internal networks.
- **Acceptance test:** unauthenticated request to `/api-docs` returns 401/404 in production.
- **Evidence:** curl output.

### 2.6 — Encrypt provider credentials at rest (`F5`)

- **Severity:** High **if** F5 confirms plaintext
- **Effort:** 1–2 ED
- **Fix approach:**
  1. Add an app-level encryption key `PROVIDER_ENCRYPTION_KEY` (32 bytes, base64).
  2. Encrypt/decrypt `ServiceProvider.credentials` using AES-256-GCM in a small `crypto.service.ts`.
  3. Migrate existing rows: read plaintext, encrypt, write back, in a one-off migration script.
  4. Never log the decrypted value; redact in the logger.
- **Acceptance test:** SQL query shows only ciphertext; provider still works.
- **Evidence:** SQL output (redacted).

**Phase 2 exit criteria:** H1, H4, M1, M2, M4, F5 all closed and covered by CI tests where applicable.

---

## Phase 3 — Feature Honesty & Resilience

**Goal:** the application must not claim to do things it does not do. This phase either finishes features or labels them as placeholders.

### 3.1 — Backup: make it real, or make it honest (`AUDIT-M9`, `F3`)

- **Severity:** Medium
- **Effort:** 2–4 ED (real) / 0.5 ED (honest)
- **Decision:** pick one:
  - **Option A — Real backups:** implement `pg_dump` on the server, store compressed dumps in a configurable directory (or S3), record size + checksum in `BackupRecord`, add a restore endpoint guarded by OWNER + MFA-equivalent confirmation. Provide a scheduled job (daily).
  - **Option B — Honest metadata:** rename the UI to "Backup log"; document that actual backups are external; add a `docs/BACKUP.md` runbook using `pg_dump` + `pg_restore`.
- **Recommendation:** Option A for any clinic relying on this for compliance; Option B only if the operator commits to external backups.
- **Acceptance test:** F3 passes; a restore to a scratch DB works.
- **Evidence:** dump file + restore transcript.

### 3.2 — WhatsApp: implement or clearly label (`AUDIT-M10`, `F1`)

- **Severity:** Medium
- **Effort:** 3–5 ED (real) / 0.5 ED (label)
- **Fix approach:**
  1. If implementing: use the WhatsApp Business Cloud API. Provider config already exists; wire `whatsapp.service.ts` to `ServiceProvider` HTTP call with retry + idempotency key. Store delivery status in `WhatsAppReminderLog`.
  2. If not implementing: change the UI badge to "Sandbox — messages are not delivered", add a banner in the reminders screen, and remove any claim of automated reminders from user-facing copy.
- **Acceptance test:** either a message is delivered to a real phone, or the UI clearly says it won't be.
- **Evidence:** delivery screenshot or UI screenshot.

### 3.3 — Payment gateways: live or manual (`F2`)

- **Severity:** Medium
- **Effort:** 3–6 ED (live) / 0.5 ED (manual)
- **Fix approach:**
  - **Live:** integrate Fawry/InstaPay APIs behind the provider framework, with webhook handlers to update `PaymentReference.status`. Sign and verify webhooks.
  - **Manual:** rename "Pay online" to "Pay via bank/InstaPay"; show instructions only; do not present a "charge" button that cannot charge.
- **Acceptance test:** a real (sandbox) payment completes and the invoice status updates.
- **Evidence:** provider sandbox logs.

### 3.4 — Recurring appointments: finish or remove from schema (`D4`)

- **Severity:** Low-Medium
- **Effort:** 2–4 ED (finish) / 0.5 ED (remove from UI, keep model)
- **Fix approach:**
  - Finish: add a UI toggle on appointment creation; on save, generate N future appointments (respecting concurrency + room caps); store `RecurringPattern` id on each. Add cancel-series endpoint.
  - Or remove: leave `RecurringPattern` for future use but do not surface it in the UI; mark as "Not implemented" in `FEATURES.md`.
- **Acceptance test:** either N appointments appear after one creation, or the UI has no recurring option.
- **Evidence:** UI screenshot.

### 3.5 — Password policy parity (`AUDIT-L1`)

- **Severity:** Low
- **Effort:** 0.5 ED
- **Fix approach:** apply the change-password strength rules (≥8, upper, lower, digit) to registration and to any OWNER-created user. Add a shared `passwordPolicy.ts` validator so the rule lives in one place.
- **Acceptance test:** registering with `abc123` is rejected.
- **Evidence:** curl output.

### 3.6 — Server-side logout with refresh-token revocation (`B10`)

- **Severity:** Medium
- **Effort:** 2–3 ED
- **Fix approach:**
  1. Add a `RefreshToken` table: `jti`, `userId`, `expiresAt`, `revokedAt`.
  2. On login/refresh, insert a row.
  3. On logout, mark revoked.
  4. In `refresh`, reject revoked/unknown `jti`.
  5. Add a cron job to purge expired rows.
- **Acceptance test:** B10 shows the refresh token is rejected after logout.
- **Evidence:** curl transcript.

### 3.7 — Account lockout and login telemetry (`AUDIT-Known-Limitation`)

- **Severity:** Medium
- **Effort:** 1–2 ED
- **Fix approach:**
  1. Track failed logins per identifier in Redis with a sliding window.
  2. Lock the account (or require a cooldown) after N failures (e.g. 10 / 15 min).
  3. Emit an `AuditLog` entry per failed attempt with action `LOGIN_FAILED` (enum already exists).
  4. Notify OWNER on repeat failures for the same identifier.
- **Acceptance test:** the 11th failed login from one IP+identifier returns a lockout message.
- **Evidence:** curl transcripts.

### 3.8 — Forgot-password flow (`AUDIT-Known-Limitation`)

- **Severity:** Medium
- **Effort:** 2–3 ED
- **Fix approach:**
  1. `POST /api/auth/forgot-password` — accept identifier; always respond 200 (do not reveal account existence).
  2. Generate a signed, single-use reset token (JWT with `type:'reset'`, 15 min TTL), stored hashed in DB.
  3. Email a reset link via the existing SMTP service.
  4. `POST /api/auth/reset-password` — verify token, enforce password policy, invalidate all refresh tokens for that user.
- **Acceptance test:** end-to-end reset works; token is single-use and expires.
- **Evidence:** email screenshot + curl transcripts.

### 3.9 — Email verification on registration (`AUDIT-Known-Limitation`)

- **Severity:** Low
- **Effort:** 1–2 ED
- **Fix approach:** send a verification link; mark `User.emailVerified` (new column). Until verified, restrict portal features or log a warning. Optional for a clinic where staff verify patients in person — decide per policy.

**Phase 3 exit criteria:** every "Partial"/"Placeholder" in `FEATURES.md` is either finished or clearly labelled; M9, M10, F1, F2, F3, D4 closed; B10 passes; L1 closed.

---

## Phase 4 — Long-Term & Architectural

### 4.1 — Remove leftover NestJS deps (`AUDIT-M5`)

- **Effort:** 0.5 ED
- **Fix approach:** confirm no imports reference `@nestjs/*` (`grep -rn "@nestjs" backend/src`), then remove `@nestjs/swagger` and `@nestjs/testing` from `package.json`. Run `npm prune` and CI.
- **Acceptance test:** `npm ls @nestjs/swagger` returns empty; CI green.

### 4.2 — De-duplicate charting and icon libraries (`AUDIT-M6`)

- **Effort:** 1–2 ED
- **Fix approach:**
  1. Inventory usage: `grep -rn "from 'chart.js'\|from 'react-chartjs-2'\|from 'recharts'\|from '@heroicons\|from 'lucide-react'" frontend/src`.
  2. Pick one of each (recommendation: **Recharts** for charts, **lucide-react** for icons — both lighter and more modern).
  3. Migrate usages incrementally; delete the other dependency.
- **Acceptance test:** bundle size drops measurably; CI green.

### 4.3 — Object storage for files (`AUDIT-M7`, `G4`)

- **Effort:** 3–5 ED
- **Fix approach:**
  1. Add S3-compatible storage (AWS S3, MinIO, or Cloudflare R2).
  2. Migrate `F

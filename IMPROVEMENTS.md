# RepurposeAI — Codebase Analysis & Improvement Plan

## Context

This plan is the result of a thorough multi-agent audit of the RepurposeAI codebase (Next.js 15 / TypeScript / Prisma / BullMQ / OpenAI / Azure). The goal is to identify every material issue across security, code quality, performance, architecture, and infrastructure, and to present them in a prioritized, actionable order. No work has been started yet — this is a read-only analysis plan.

---

## Stack Snapshot

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5, React 19, App Router |
| API | tRPC 11.7 + React Query 5 |
| Auth | NextAuth 4.24 (JWT, Google OAuth, Credentials) |
| Database | PostgreSQL + Prisma 6.16 |
| Queue | BullMQ 5.61 + IORedis + separate worker process |
| AI | OpenAI (Whisper-1 transcription, GPT-4o clip extraction) |
| Payments | Stripe 18.5 |
| Storage | Local filesystem (`public/uploads/`) |
| Styling | Tailwind CSS 3.4 + Shadcn/ui + Radix UI |
| State | Zustand 5.0 |
| Email | React Email + Nodemailer (ZeptoMail SMTP) |
| Deploy | Azure Web App (main) + Azure Container Apps (workers) |

---

## 1. Security

| ID | Issue | File(s) | Severity |
|---|---|---|---|
| S-1 | **No rate limiting** on `/api/auth/register` and NextAuth credentials handler | `src/app/api/auth/register/route.ts`, `src/lib/auth.ts` | Critical |
| S-2 | **Account linking race condition** — concurrent Google sign-ins trigger unhandled Prisma unique constraint violation (500 instead of graceful error) | `src/lib/auth.ts` lines 81-188 | Critical |
| S-3 | **Email template HTML injection** — `data.user.name` and similar fields interpolated raw into HTML | `src/lib/email/index.ts` | High |
| S-4 | **No server-side password complexity** — `/api/auth/register` only checks field existence | `src/app/api/auth/register/route.ts` | High |
| S-5 | **Stripe price IDs hardcoded** in webhook handler instead of environment variables | `src/app/api/webhooks/stripe/route.ts` | High |
| S-6 | **No CSRF protection** on `/api/auth/register` | `src/app/api/auth/register/route.ts` | Medium |
| S-7 | **FFmpeg stderr surfaced in error responses** — leaks internal toolchain details | `src/lib/video-processing.ts` | Medium |
| S-8 | **No audit logging** — subscription changes, quota operations, emails sent leave no trail | Across workers and routers | Medium |

---

## 2. Code Quality

| ID | Issue | File(s) | Severity |
|---|---|---|---|
| Q-1 | **`noImplicitAny: false` overrides `strict: true`** — contradictory tsconfig allows implicit `any` everywhere | `tsconfig.json` line 16 | High |
| Q-2 | **No test framework** — CI uses `npm run test --if-present` and passes silently with zero tests | `package.json`, `.github/workflows/ci.yml` | High |
| Q-3 | **Six `render as any` casts** in email utilities where proper types exist | `src/lib/email/test-structure.ts` | Medium |
| Q-4 | **Empty `.eslintrc.json`** coexists with `eslint.config.mjs` — causes tooling confusion | `.eslintrc.json` | Medium |
| Q-5 | **`app/page.tsx` excluded from ESLint** — highest-traffic public page gets no linting | `eslint.config.mjs` ignores list | Medium |
| Q-6 | **`_ctx` pattern in tRPC routers** — context accepted but unused, indicating missing auth or tenant checks | `src/server/api/routers/*.ts` | Low |
| Q-7 | **Docstrings absent** from most functions despite CLAUDE.md mandate | Codebase-wide | Low |

---

## 3. Performance

| ID | Issue | File(s) | Severity |
|---|---|---|---|
| P-1 | **No pagination on `getUserVideos`** — full table scan and unbounded payload per page load | `src/server/api/routers/video.ts` | High |
| P-2 | **Base64 video upload via tRPC body** — a 500 MB file requires ~667 MB of JS heap in-browser | `src/server/api/routers/video.ts` (`uploadVideo`), `src/components/dashboard/UploadPage.tsx` | High |
| P-3 | **Per-video polling** (`useVideoPolling`) fires one HTTP request per video at 1-3s intervals | `src/components/hooks/useVideoPolling.ts` | Medium |
| P-4 | **No exponential backoff with jitter** in polling — long jobs hold high poll rate throughout | `src/components/hooks/useVideoPolling.ts` | Medium |
| P-5 | **No component-level code splitting** on dashboard pages | `src/app/dashboard/*/page.tsx` | Low |

---

## 4. Architecture / Design

| ID | Issue | File(s) | Severity |
|---|---|---|---|
| A-1 | **Local file storage in `public/uploads/`** — wiped on every deployment; no access control; not CDN-friendly | `src/lib/storage.ts`, `src/app/api/upload/video/route.ts` | Critical |
| A-2 | **No database transaction** wrapping clip creation + status update — partial failure leaves orphaned clips | `src/lib/workers/videoWorker.ts` | Critical |
| A-3 | **No FFmpeg process timeout** — a malformed video can hang a worker slot indefinitely | `src/lib/video-processing.ts` | High |
| A-4 | **Five dashboard pages are stubs** — AI Clips, Projects, Templates, Editor, Settings render placeholder UI | `src/app/dashboard/ai-clips/`, `editor/`, `projects/`, `templates/`, `settings/` | High |
| A-5 | **Hardcoded subscription plan limits** (file size thresholds per plan) in router code | `src/server/api/routers/video.ts` | Medium |
| A-6 | **Zustand store not synchronized with NextAuth session refreshes** — stale subscription data shown to user | `src/lib/store.ts`, session callbacks in `src/lib/auth.ts` | Medium |
| A-7 | **No React error boundaries** — one crashing widget unmounts the entire dashboard | All dashboard page components | Medium |

---

## 5. Infrastructure / Operations

| ID | Issue | File(s) | Severity |
|---|---|---|---|
| I-1 | **No error tracking or APM** — only `console.log`; production errors invisible without log tailing | Codebase-wide | High |
| I-2 | **CI test step silently skips** — green CI check means nothing for correctness | `.github/workflows/ci.yml` | High |
| I-3 | **Two `CLAUDE.md` files** — `/claude/CLAUDE.md` and `/.claude/CLAUDE.md` create ambiguity about the canonical standard | `/claude/CLAUDE.md`, `/.claude/CLAUDE.md` | Medium |
| I-4 | **No structured logging** — unstructured `console.*` cannot be queried or alerted on | Codebase-wide | Medium |
| I-5 | **Redis TLS not validated at startup** — misconfigured TLS fails silently at runtime | `src/lib/redis/connection.ts` | Medium |
| I-6 | **`engine-strict=true` paired with `legacy-peer-deps=true`** — peer dep relaxation masks compatibility issues | `.npmrc` | Low |

---

## Recommended Implementation Phases

### Phase 1 — Stop the Bleeding (1-2 sprints)
These items pose immediate data loss, security, or availability risk.

1. **A-1** Migrate video storage to Azure Blob Storage (or S3-compatible); remove `public/uploads/` and replace with signed URL serving.
2. **A-2** Wrap clip creation + `video.status` update in a Prisma `$transaction` in the video worker.
3. **A-3** Add process kill timeout to FFmpeg calls; configure BullMQ `timeout` per job.
4. **S-1** Add rate limiting to `/api/auth/register` and the NextAuth credentials provider (e.g., `@upstash/ratelimit` backed by the existing Redis instance).
5. **S-2** Wrap the Google account-linking Prisma upsert in try/catch; return a `409 Conflict` with a user-friendly message on unique constraint violation.

### Phase 2 — Correctness & Reliability (2-3 sprints)

6. **Q-1** Fix `tsconfig.json`: remove `"noImplicitAny": false`; fix any newly surfaced type errors.
7. **Q-2** Install Vitest; write first integration tests (auth, quota enforcement, webhook signature); make `npm run test` exit non-zero; gate CI on it.
8. **I-1** Integrate Sentry for error tracking; add Pino for structured logging; replace `console.*` calls.
9. **P-1** Add cursor-based pagination to `getUserVideos`; update dashboard query and UI to load incrementally.
10. **S-3** HTML-encode user-supplied fields in email templates (use a library like `he` or `sanitize-html`).
11. **S-4** Add server-side password complexity validation (min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char) to `/api/auth/register`.

### Phase 3 — Quality & Scalability (3-4 sprints)

12. **A-4** Implement stub dashboard pages — Settings first (user control), then AI Clips (core value prop).
13. **P-2** Replace base64 tRPC upload with presigned URL flow: client uploads directly to blob storage; server only records metadata.
14. **P-3/P-4** Consolidate polling into a batch status endpoint; add exponential backoff with jitter in `useVideoPolling`.
15. **A-6** Subscribe Zustand user store to `useSession` updates from NextAuth.
16. **A-7** Add `<ErrorBoundary>` around each dashboard section/widget.
17. **S-5** Move Stripe price IDs to environment variables (`STRIPE_STARTER_PRICE_ID`, `STRIPE_CREATOR_PRICE_ID`, etc.).

### Phase 4 — Hygiene (ongoing)

18. **Q-3** Remove `as any` casts in email utilities; use proper React Email types.
19. **Q-4** Delete empty `.eslintrc.json`.
20. **Q-5** Remove `app/page.tsx` from the ESLint ignore list; fix any new lint errors.
21. **I-3** Delete `/claude/CLAUDE.md`; keep only `/.claude/CLAUDE.md` as the canonical standard.
22. **A-5** Externalize subscription plan limits to a config table or environment variables.
23. **I-5** Add a startup assertion in `src/lib/redis/connection.ts` that validates TLS is configured when `NODE_ENV === 'production'`.
24. **Q-6** Audit all `_ctx` routers for missing authorization or tenant checks.
25. **S-7** Sanitize FFmpeg stderr before surfacing in error responses (strip file paths, version strings).
26. **S-8** Add an `AuditLog` Prisma model and log sensitive actions.

---

## Critical Files

- `src/server/api/routers/video.ts` — upload, quota, processing
- `src/lib/workers/videoWorker.ts` — BullMQ video processor (transaction gap, no timeout)
- `src/lib/video-processing.ts` — FFmpeg integration (no kill timeout)
- `src/lib/storage.ts` — local file storage (critical A-1)
- `src/app/api/auth/register/route.ts` — no rate limit, no complexity check
- `src/lib/auth.ts` — account linking race condition (S-2)
- `src/lib/email/index.ts` — HTML injection risk (S-3)
- `src/lib/email/test-structure.ts` — `as any` casts (Q-3)
- `tsconfig.json` — contradictory `noImplicitAny` (Q-1)
- `src/components/hooks/useVideoPolling.ts` — polling performance (P-3, P-4)
- `src/lib/store.ts` — Zustand/session desync (A-6)
- `.github/workflows/ci.yml` — silent test skip (I-2)

---

## Verification Approach

After implementing each phase:
- **Phase 1:** Load-test auth endpoints with `ab` or `k6`; deploy to staging and delete the container to verify videos survive (blob storage); intentionally corrupt a video file and confirm the worker recovers cleanly.
- **Phase 2:** `npm run test` must exit non-zero on CI; ESLint must pass with no `any` suppressions in critical paths; Sentry dashboard must show real errors from staging.
- **Phase 3:** Upload a 500 MB file via the new presigned URL flow and confirm no OOM crash; verify the dashboard loads with >50 videos under 500 ms.
- **Phase 4:** `tsc --noEmit` with zero errors; `eslint src/` with zero suppressions on core files.

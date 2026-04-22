# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Coding standards, workflow rules, and review process live in [claude/CLAUDE.md](claude/CLAUDE.md). Re-read that file at session start and whenever "reload baseline" is said.

## Commands

```bash
# Development (run in separate terminals, or use dev:all)
npm run dev               # Next.js dev server → http://localhost:3000
npm run dev:video-worker  # Video processing worker (required for uploads)
npm run dev:all           # Both above concurrently

# Build
npm run build             # prisma generate + next build
npm start                 # Production server

# Database
npm run db:generate       # Regenerate Prisma client after schema change
npm run db:push           # Sync schema to DB without a migration (dev only)
npm run db:migrate        # Create and apply a migration
npm run db:studio         # Open Prisma Studio GUI

# Code quality
npm run lint              # ESLint (flat config in eslint.config.mjs)

# Integration smoke tests (no unit test framework exists yet)
npm run test:redis        # Verify Redis connectivity
npm run test:smoke        # App health checks
npm run test:video-queue  # Enqueue a test video job end-to-end
```

## Architecture

### Request path

```
Browser → Next.js App Router
  ├── /api/upload/video      → validates auth + quota → saves file to disk
  │                            → enqueues BullMQ job → returns 202
  ├── /api/trpc/[trpc]       → tRPC fetch handler (see src/server/api/root.ts)
  ├── /api/auth/[...nextauth] → NextAuth (Google OAuth + Credentials)
  └── /api/webhooks/stripe   → Stripe event handler
```

### Video processing pipeline

Upload route writes the file to `public/uploads/videos/{id}.mp4`, creates a `Video` DB record (`status: uploading`), then enqueues a `VideoProcessingJob` on the `video-processing` BullMQ queue.

The **video worker** (`src/lib/workers/videoWorker.ts`) runs as a separate Node process and handles the job:
1. Mark video `status: processing`
2. Extract audio with FFmpeg → transcribe with OpenAI Whisper
3. Identify key moments with GPT-4o
4. Render clips in requested aspect ratios (FFmpeg)
5. Prisma `$transaction`: create `VideoClip` rows + mark video `status: completed`

The frontend polls video status via a `useVideoPolling` hook until terminal state.

### Key layers

| Layer | Path | Notes |
|---|---|---|
| API routes | `src/app/api/` | Upload, auth, tRPC handler, Stripe webhook |
| tRPC routers | `src/server/api/routers/` | `video`, `user`, `subscription`, `email` — composed in `root.ts` |
| Background workers | `src/lib/workers/` | `videoWorker.ts`, `emailWorker.ts` — separate Node processes |
| Queue definitions | `src/lib/queues/` | BullMQ queues backed by Redis (`src/lib/redis/connection.ts`) |
| Storage abstraction | `src/lib/storage.ts` | `StorageProvider` interface; currently `LocalStorageProvider` writing to `public/uploads/`; ready to swap for cloud object storage |
| Auth | `src/lib/auth.ts` | NextAuth config: Google OAuth + bcrypt Credentials; JWT sessions |
| Prisma singleton | `src/lib/prisma.ts` | Import as `import { prisma } from '@/lib/prisma'` everywhere |
| Video processing | `src/lib/video-processing.ts` | FFmpeg CLI + OpenAI SDK; timeout guarded by `FFMPEG_TIMEOUT_MS` |

### Auth flow

NextAuth `signIn` callback in `src/lib/auth.ts` handles both paths:
- **Google OAuth** — finds or creates `User` + `Account`; links to existing email if the address matches a credentials account.
- **Credentials** — validates password with bcrypt; rate-limited via `src/lib/rate-limiter.ts` (Redis-backed, fail-open).

Session strategy is JWT. `user.id` is added to the token in the `jwt` callback and exposed via `session.user.id`.

### Database models (Prisma)

`User` → `Video` (1:N) → `VideoClip` (1:N). `Account`/`Session`/`VerificationToken` are NextAuth adapter tables. `EmailLog` and `EmailPreference` support the transactional email system. All child records cascade-delete with their parent.

Schema: `prisma/schema.prisma`. After any schema edit run `npm run db:generate` then `npm run db:push` (dev) or `npm run db:migrate` (tracked migration).

### Queue configuration

- **`video-processing`** queue: 3 concurrent workers, 10 jobs/min, 3 retries with exponential backoff (10 s initial). Completed jobs pruned after 24 h; failed after 7 days.
- **`email`** queue: 5 concurrent workers, 3 retries, 5 s backoff.
- Redis connection in `src/lib/redis/connection.ts` — TLS auto-enabled for `rediss://` URLs or `REDIS_TLS=true`.

### Environment variables

Required at runtime: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REDIS_URL`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

Optional tuning: `FFMPEG_TIMEOUT_MS` (default 900 000 ms), `BULLMQ_JOB_TIMEOUT_MS` (default 1 200 000 ms), `REDIS_TLS`.

See `.env.example` for the full list with descriptions.

# Railway Healthcheck Fix

## Problem

Railway hits `GET /api/health/redis` unauthenticated on every deploy.
That endpoint calls `getRedis()` which throws if `REDIS_URL` is missing → returns HTTP 500 → Railway marks the deploy as failed.

The build itself is fine. This is purely a healthcheck configuration + missing env vars issue.

---

## Fix 1 — Add a simple liveness endpoint

Create `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

No dependencies, always returns 200. This is what Railway should use.

---

## Fix 2 — Update `railway.toml`

Change `healthcheckPath` from `/api/health/redis` to `/api/health`:

```toml
[build]
builder = "nixpacks"

[deploy]
releaseCommand = "bash scripts/deploy.sh"
startCommand = "node .next/standalone/server.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

The existing `/api/health/redis` endpoint stays untouched for manual ops checks.

---

## Fix 3 — Set env vars in Railway

In Railway → project → **web service** → **Variables**, make sure all of these are present.

The **Redis plugin auto-injects `REDIS_URL`** — do not set it manually.
All others must be added:

| Variable | Source |
|---|---|
| `DATABASE_URL` | Neon dashboard → pooled connection string |
| `DATABASE_URL_UNPOOLED` | Neon dashboard → direct connection string |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Railway web service URL (e.g. `https://repurposeai.up.railway.app`) |
| `GOOGLE_CLIENT_ID` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
| `OPENAI_API_KEY` | platform.openai.com |
| `STRIPE_SECRET_KEY` | Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks |
| `SMTP_HOST` | ZeptoMail |
| `SMTP_PORT` | ZeptoMail (587) |
| `SMTP_USER` | ZeptoMail |
| `SMTP_PASS` | ZeptoMail |
| `R2_ACCOUNT_ID` | Cloudflare → R2 → Manage API tokens |
| `R2_ACCESS_KEY_ID` | Cloudflare → R2 → Manage API tokens |
| `R2_SECRET_ACCESS_KEY` | Cloudflare → R2 → Manage API tokens |
| `R2_BUCKET_NAME` | Your R2 bucket name |
| `R2_PUBLIC_URL` | R2 bucket → Settings → Public URL |

---

## Files to change

| File | Change |
|---|---|
| `src/app/api/health/route.ts` | **Create** — simple 200 liveness endpoint |
| `railway.toml` | Update `healthcheckPath = "/api/health"` |

---

## After making changes

1. Commit and push to `dev`
2. Railway will auto-redeploy
3. Healthcheck hits `/api/health` → always 200 → deploy succeeds
4. Visit the app URL, register/log in to verify the full stack works

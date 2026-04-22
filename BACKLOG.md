# RepurposeAI — Outstanding Work

Items are ordered by risk/impact. Each section includes the relevant files and enough context to implement from a fresh session.

---

## 1. Subscription Email Template Correctness (correctness risk)

**Problem:** `sendSubscriptionEmail()` in `src/lib/email/index.ts` maps `upgraded`, `downgraded`, and `cancelled` events to `SubscriptionActivatedEmail` — users receive a "welcome to your plan" email when they cancel or downgrade.

**What needs to be built:**

1. **`SubscriptionCancelledEmail.tsx`** — tone: neutral/confirmatory; show plan name, access end date, and a reactivation CTA. Save at `src/lib/email/templates/subscription/SubscriptionCancelledEmail.tsx`.
2. **`SubscriptionDowngradedEmail.tsx`** — tone: positive; confirm new plan name and what changes. Save at `src/lib/email/templates/subscription/SubscriptionDowngradedEmail.tsx`.
3. Wire the new templates into `generateEmailContent()` in `src/lib/email/index.ts` — add `SUBSCRIPTION_CANCELLED` and `SUBSCRIPTION_DOWNGRADED` cases to the switch statement.

**Key files:**
- `src/lib/email/index.ts` — `generateEmailContent()` switch (~line 195), `sendSubscriptionEmail()` (~line 128)
- `src/lib/email/templates/subscription/SubscriptionActivatedEmail.tsx` — reference pattern for new templates
- `src/lib/email/templates/components/BaseTemplate.tsx` — wraps all templates

---

## 2. Password Reset Token Cleanup (security hygiene)

**Problem:** `user.requestPasswordReset` in `src/server/api/routers/user.ts` generates a new `VerificationToken` per request without deleting prior tokens for the same email. Multiple valid reset links can accumulate, and a stale link from days ago remains usable until it expires.

**Fix:** In `requestPasswordReset`, before creating the new token add:
```ts
await ctx.prisma.verificationToken.deleteMany({ where: { identifier: input.email } });
```

**Key file:**
- `src/server/api/routers/user.ts` — `requestPasswordReset` mutation

---

## 3. Change Password in Settings

**Problem:** Logged-in credentials users can only change their password through the forgot-password email flow. There is no in-app form.

**What needs to be built:**

1. **`user.changePassword` mutation** (protected procedure) in `src/server/api/routers/user.ts`:
   - Input: `{ currentPassword: z.string(), newPassword: z.string().min(8) }`
   - Fetch `user.password`; if null (OAuth-only account) throw `BAD_REQUEST` ("No password set on this account")
   - `bcrypt.compare(currentPassword, user.password)` — throw `UNAUTHORIZED` on mismatch
   - `bcrypt.hash(newPassword, 10)` → `prisma.user.update`
2. **UI** in `src/components/dashboard/SettingsPage.tsx` `renderPrivacySection()` — add a "Change Password" card above the Danger Zone with current password + new password inputs, wired to the mutation.

**Key files:**
- `src/server/api/routers/user.ts` — `bcrypt` already imported, same pattern as `resetPassword`
- `src/components/dashboard/SettingsPage.tsx` — `renderPrivacySection()` (~line 233)

---

## 4. Email Verification for Credentials Accounts

**Problem:** New accounts created via the `/register` route (`src/app/api/auth/register/route.ts`) are immediately active with `emailVerified = null`. There is no verification step, so typo'd emails go undetected and the `emailVerified` field is permanently null for all credentials users.

**What needs to be built:**

1. After user creation in `register/route.ts`, generate a token (`crypto.randomBytes(32).toString('hex')`), store it in `VerificationToken` (`identifier = email`, `expires = +24h`), and call `EmailService.sendEmail(EmailType.EMAIL_VERIFICATION, userId, data)`.
2. Add `EMAIL_VERIFICATION = 'EMAIL_VERIFICATION'` to the `EmailType` enum in `src/lib/email/types.ts` and wire subject/message in `src/lib/email/index.ts`.
3. Add a **`/verify-email?token=...` page** — on load, calls a new `user.verifyEmail` public procedure that finds the token, sets `user.emailVerified = new Date()`, and deletes the token.
4. Add `user.verifyEmail` public procedure to `src/server/api/routers/user.ts` — same lookup/delete pattern as `resetPassword`.
5. Add an `EmailVerificationEmail.tsx` template at `src/lib/email/templates/auth/`.

**Note:** Do not gate dashboard access behind verification yet — just set the field; gating is a separate product decision.

**Key files:**
- `src/app/api/auth/register/route.ts` — trigger verification after user creation
- `src/server/api/routers/user.ts` — add `verifyEmail` procedure
- `src/lib/email/types.ts` — add `EMAIL_VERIFICATION`
- `src/lib/email/index.ts` — add subject + message + React template case

---

## 5. Settings Export Buttons

**Problem:** The three "Export" buttons in `src/components/dashboard/SettingsPage.tsx` `renderExportSection()` render but have no handlers. Clicking them does nothing.

**What needs to be built:**

- **Export Account Data** — generate a JSON blob of the user's profile + email preferences from tRPC (use `user.getProfile`) and trigger a browser download via `URL.createObjectURL`.
- **Export Projects** — call `video.getUserVideos` (paginated if needed) and download a JSON manifest of video titles, statuses, and clip URLs.
- **Export Analytics** — call `user.getStats` and download the stats JSON.

All three can be pure client-side: fetch via tRPC, `JSON.stringify`, create a `Blob`, and trigger `<a download>`. No new API routes needed.

**Key file:**
- `src/components/dashboard/SettingsPage.tsx` — `renderExportSection()` (~line 358)

---

## 6. Avatar Upload / Remove

**Problem:** "Change Avatar" and "Remove Avatar" buttons in `src/components/dashboard/SettingsPage.tsx` `renderProfileSection()` have no handlers.

**What needs to be built:**

- "Change Avatar" — hidden `<input type="file" accept="image/*">` triggered by the button; on change, upload to `/api/upload/avatar` (new route), store in `public/uploads/avatars/{userId}.{ext}`, update `user.image` via a new `user.updateAvatar` mutation.
- "Remove Avatar" — call a `user.removeAvatar` mutation that sets `user.image = null`.
- Avatar URL should be served from the `StorageProvider` (`src/lib/storage.ts`) to remain consistent with video uploads.

**Key files:**
- `src/components/dashboard/SettingsPage.tsx` — `renderProfileSection()` (~line 89)
- `src/server/api/routers/user.ts` — add `updateAvatar` / `removeAvatar` mutations
- `src/lib/storage.ts` — `StorageProvider` interface for file writes

---

## 7. Stripe Price ID → Config Object

**Problem:** The Stripe price ID → plan name mapping in `src/app/api/webhooks/stripe/route.ts` (`upsertSubscription`, ~lines 33–49) is hardcoded inline. Adding or changing a price requires editing the handler directly.

**Fix:** Extract to a named constant object at the top of the file (or a shared `src/lib/stripe/plans.ts` config):
```ts
export const PRICE_PLAN_MAP: Record<string, 'starter' | 'creator' | 'producer'> = {
  prod_Sv9zE3Lt3Dza4U: 'starter',
  prod_Szk7iWgJ9yfxrq: 'starter',
  prod_SzjVo4rdm3LBx0: 'creator',
  prod_Szk5YrAfOq7C0l: 'creator',
  prod_Szjf5hO6PQoUja: 'producer',
  prod_Szk4OGazQoSRbi: 'producer',
};
```
Replace the `switch` in `upsertSubscription` with a lookup: `status = PRICE_PLAN_MAP[priceId] ?? 'free'`.

**Key file:**
- `src/app/api/webhooks/stripe/route.ts` — `upsertSubscription()` function

---

## 8. Dashboard Bar Chart (ROI by Feature) — cosmetic

**Problem:** The bar chart in `src/components/dashboard/DashboardPage.tsx` still displays hardcoded sample data labeled "Sample data". The pie chart was wired to real data in the previous session.

**What would replace it:**
- Group `VideoClip` records by `aspectRatio` and count per group — add a `clipsByAspectRatio` field to `user.getStats` in `src/server/api/routers/user.ts`.
- Labels: map aspect ratio strings (`'9:16'`, `'16:9'`, `'1:1'`) to friendly names (`'Vertical'`, `'Landscape'`, `'Square'`).
- Wire to `roiChartData` in `DashboardPage.tsx` and remove the "Sample data" label.

This is cosmetic — leave as-is if there aren't enough clips to make the chart meaningful yet.

---

## Already Working (for reference)

- Video upload, processing pipeline, clip generation end-to-end
- Transcript storage and AI timestamp validation
- Quota enforcement and refund on failure
- Aspect ratio options passed through from job
- Email notifications on job completion/failure with real user data (React Email templates: Welcome, ProcessingComplete, ProcessingFailed, SubscriptionActivated, PaymentFailed, PasswordReset)
- Email preferences persisted to DB
- Settings profile save
- Dashboard KPIs and activity feed from real data
- Dashboard pie chart (Project Status) wired to real video status counts
- Projects page with cursor-based pagination (20 videos/page, "Load more")
- AI Clips page wired to real video data
- Stripe checkout, portal, and cancel subscription
- Stripe webhooks fully implemented: subscription created/updated/deleted/paused/resumed, invoice.payment_succeeded, invoice.payment_failed — all idempotent via WebhookEvent dedup table
- Settings billing section wired to real subscription data (plan name, renewal date, Stripe portal redirect)
- Account deletion (cancels Stripe subscription, cascades all DB rows, signs out)
- Password reset flow: /forgot-password → email → /reset-password (VerificationToken-based, bcrypt hashed)
- Google OAuth + Credentials auth with rate limiting

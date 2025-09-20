# AI Implementation Prompt: ZeptoMail Transactional Emails for Repurpose AI

## Project Overview
Implement a complete transactional email system for Repurpose AI (re-purpose.studio) video repurposing SaaS using ZeptoMail SMTP. The application uses Next.js 14, TypeScript, tRPC, Prisma, NextAuth.js, and Stripe with a subscription model.

## Application Context
- **Domain**: re-purpose.studio
- **Tech Stack**: Next.js 14, TypeScript, tRPC, Prisma, NextAuth.js, Stripe, Zustand
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Google OAuth (NextAuth.js with NEXTAUTH_SECRET and NEXTAUTH_URL only)
- **Payment Plans**: Free, Starter, Creator, Producer (no trial offered)
- **Email Provider**: ZeptoMail SMTP

## Environment Variables Structure

### Required .env Variables
```env
# ZeptoMail SMTP Configuration
ZEPTOMAIL_FROM_EMAIL="noreply@re-purpose.studio"
ZEPTOMAIL_SMTP_HOST="smtp.zeptomail.com"
ZEPTOMAIL_SMTP_PORT="587"
ZEPTOMAIL_SMTP_USER="your-smtp-username"
ZEPTOMAIL_SMTP_PASS="your-smtp-password"

# Email Branding
FROM_NAME="Repurpose AI"
SUPPORT_EMAIL="support@re-purpose.studio"
WEBAPP_URL="https://re-purpose.studio"

# NextAuth Configuration (existing)
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://re-purpose.studio"

# Other existing variables...
DATABASE_URL="postgresql://..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
STRIPE_SECRET_KEY="..."
OPENAI_API_KEY="..."
```

## Required Email Types

### 1. Authentication & Onboarding
- **welcome** - New user first login via Google OAuth
- **login-security-alert** - New device/location login (optional)

### 2. Video Processing Notifications
- **processing-started** - Video upload initiated
- **processing-complete** - Clips ready with download links
- **processing-failed** - Processing error with support contact
- **quota-warning** - Approaching monthly processing limits (80% usage)
- **quota-exceeded** - Monthly limit reached, upgrade prompt

### 3. Subscription Management (Stripe Integration)
- **subscription-activated** - Plan upgraded (Free → Starter/Creator/Producer)
- **subscription-upgraded** - Plan changed (Starter → Creator, etc.)
- **subscription-downgraded** - Plan downgraded (Creator → Starter, etc.)
- **payment-successful** - Monthly payment confirmation
- **payment-failed** - Payment retry notification with grace period
- **subscription-cancelled** - Cancellation confirmation
- **subscription-reactivated** - Reactivation after cancellation
- **downgrade-to-free** - Subscription ended, moved to Free plan

### 4. Engagement & Retention
- **weekly-digest** - Weekly processing summary and tips
- **feature-announcement** - New features and updates
- **usage-tips** - Best practices and optimization tips
- **reactivation** - For users who haven't processed videos in 30+ days

## Technical Implementation

### 1. Project Structure
```
src/lib/email/
├── index.ts                    # Main EmailService class
├── config.ts                   # Email configuration and validation
├── providers/
│   ├── zeptomail.ts           # ZeptoMail SMTP provider
│   └── types.ts               # Provider interfaces
├── templates/
│   ├── components/
│   │   ├── layout.tsx         # Base email layout
│   │   ├── header.tsx         # Email header with logo
│   │   ├── footer.tsx         # Unsubscribe footer
│   │   └── button.tsx         # CTA buttons
│   ├── auth/
│   │   ├── welcome.tsx
│   │   └── login-alert.tsx
│   ├── processing/
│   │   ├── started.tsx
│   │   ├── complete.tsx
│   │   ├── failed.tsx
│   │   ├── quota-warning.tsx
│   │   └── quota-exceeded.tsx
│   ├── subscription/
│   │   ├── activated.tsx
│   │   ├── upgraded.tsx
│   │   ├── payment-success.tsx
│   │   ├── payment-failed.tsx
│   │   ├── cancelled.tsx
│   │   └── downgraded.tsx
│   └── engagement/
│       ├── weekly-digest.tsx
│       ├── feature-announcement.tsx
│       └── reactivation.tsx
├── renderer.ts                # React email template renderer
├── queue.ts                   # Email queue system
├── types.ts                   # Email type definitions
└── utils.ts                   # Email utilities
```

### 2. Package Dependencies
Install required packages:
```bash
npm install nodemailer @types/nodemailer react-email @react-email/components
```

### 3. Core Implementation Requirements

#### ZeptoMail SMTP Provider
```typescript
// src/lib/email/providers/zeptomail.ts
import nodemailer from 'nodemailer';

export class ZeptoMailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.ZEPTOMAIL_SMTP_HOST!,
      port: parseInt(process.env.ZEPTOMAIL_SMTP_PORT!),
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.ZEPTOMAIL_SMTP_USER!,
        pass: process.env.ZEPTOMAIL_SMTP_PASS!,
      },
    });
  }

  async send(options: EmailOptions): Promise<EmailResult>
  async verify(): Promise<boolean>
  async sendBatch(emails: EmailOptions[]): Promise<EmailResult[]>
}
```

#### Main Email Service
```typescript
// src/lib/email/index.ts
export class EmailService {
  private provider: ZeptoMailProvider;
  private queue: EmailQueue;

  async sendEmail(type: EmailType, userId: string, data: EmailData): Promise<boolean>
  async sendWelcomeEmail(user: User): Promise<boolean>
  async sendProcessingEmail(type: 'started' | 'complete' | 'failed', userId: string, videoData: any): Promise<boolean>
  async sendSubscriptionEmail(type: SubscriptionEmailType, userId: string, subscriptionData: any): Promise<boolean>
  async sendBulkEmail(type: EmailType, users: User[], data: EmailData): Promise<boolean>
}
```

### 4. Database Schema Updates

Add to `prisma/schema.prisma`:
```prisma
model EmailLog {
  id          String   @id @default(cuid())
  userId      String?
  email       String
  type        EmailType
  status      EmailStatus // QUEUED, SENT, DELIVERED, FAILED, BOUNCED
  subject     String
  error       String?
  metadata    Json?
  sentAt      DateTime @default(now())
  deliveredAt DateTime?
  openedAt    DateTime?
  clickedAt   DateTime?
  
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([type])
  @@index([status])
  @@index([sentAt])
  @@map("email_logs")
}

model EmailPreference {
  id                    String  @id @default(cuid())
  userId               String  @unique
  marketingEmails      Boolean @default(true)
  processingUpdates    Boolean @default(true)
  weeklyDigest         Boolean @default(true)
  featureAnnouncements Boolean @default(true)
  unsubscribedAt       DateTime?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("email_preferences")
}

enum EmailType {
  WELCOME
  LOGIN_ALERT
  PROCESSING_STARTED
  PROCESSING_COMPLETE
  PROCESSING_FAILED
  QUOTA_WARNING
  QUOTA_EXCEEDED
  SUBSCRIPTION_ACTIVATED
  SUBSCRIPTION_UPGRADED
  SUBSCRIPTION_DOWNGRADED
  PAYMENT_SUCCESSFUL
  PAYMENT_FAILED
  SUBSCRIPTION_CANCELLED
  DOWNGRADE_TO_FREE
  WEEKLY_DIGEST
  FEATURE_ANNOUNCEMENT
  REACTIVATION
}

enum EmailStatus {
  QUEUED
  SENT
  DELIVERED
  FAILED
  BOUNCED
  OPENED
  CLICKED
}
```

### 5. Email Templates

#### Template Requirements
- **Brand Consistent**: Use re-purpose.studio branding and colors
- **Mobile Responsive**: Works on all email clients
- **Dark Theme Compatible**: Matches app's dark theme
- **Unsubscribe Links**: GDPR compliant unsubscribe in footer
- **Clear CTAs**: Prominent action buttons
- **Personalization**: User name, plan type, usage stats

#### Template Data Structure
```typescript
export interface EmailTemplateData {
  user: {
    name: string;
    email: string;
    plan: 'Free' | 'Starter' | 'Creator' | 'Producer';
  };
  video?: {
    title: string;
    duration: number;
    clipsGenerated: number;
    downloadUrl: string;
  };
  subscription?: {
    planName: string;
    amount: number;
    nextBillingDate: string;
    gracePeriodEnd?: string;
  };
  usage?: {
    videosProcessed: number;
    monthlyLimit: number;
    resetDate: string;
  };
  unsubscribeUrl: string;
  supportUrl: string;
}
```

### 6. Integration Points

#### NextAuth.js Integration
```typescript
// Integrate with existing auth callbacks
// Only use NEXTAUTH_SECRET and NEXTAUTH_URL
// Send welcome email on first sign-in
// Track login alerts if needed
```

#### Stripe Webhooks Integration
```typescript
// Extend existing webhook handlers for:
// - customer.subscription.created
// - customer.subscription.updated
// - customer.subscription.deleted
// - invoice.payment_succeeded
// - invoice.payment_failed
// - Plan changes: Free ↔ Starter ↔ Creator ↔ Producer
```

#### Video Processing Integration
```typescript
// Integrate with existing video processing pipeline
// Send emails at key processing stages
// Include usage tracking and quota monitoring
```

### 7. tRPC Router Implementation

```typescript
// src/server/api/routers/email.ts
export const emailRouter = createTRPCRouter({
  getUserPreferences: protectedProcedure.query(),
  updatePreferences: protectedProcedure.input(emailPreferencesSchema).mutation(),
  getEmailHistory: protectedProcedure.query(),
  resendEmail: protectedProcedure.input(z.object({ emailLogId: z.string() })).mutation(),
  unsubscribe: publicProcedure.input(z.object({ token: z.string() })).mutation(),
  previewTemplate: protectedProcedure.input(templatePreviewSchema).query(), // Dev only
});
```

### 8. Background Job System

#### Email Queue Implementation
```typescript
// src/lib/email/queue.ts
export class EmailQueue {
  async add(email: QueuedEmail): Promise<void>
  async process(): Promise<void>
  async retry(failedEmail: EmailLog): Promise<void>
  async getQueueStats(): Promise<QueueStats>
}

// Simple in-memory queue or integrate with existing job system
// Handle rate limiting (ZeptoMail limits)
// Implement exponential backoff for retries
```

### 9. Admin Features

#### Email Management Dashboard
Add to existing admin interface:
- Email logs and delivery statistics
- User email preferences management
- Bulk email composer
- Template preview system
- Queue monitoring

### 10. Email Template Examples

#### Welcome Email Content Structure
```
Subject: Welcome to Repurpose AI! 🎬

Header: Repurpose AI logo + "Welcome!"
Body: 
- Welcome message
- What they can do (upload videos, generate clips)
- Current plan benefits (Free plan features)
- Quick start guide link
- Support contact
Footer: Unsubscribe + support links
```

#### Processing Complete Email
```
Subject: Your video clips are ready! ✨

Header: "Processing Complete"
Body:
- Video title and processing time
- Number of clips generated
- Download button/link
- Usage stats (X of Y videos this month)
- Tips for optimizing clips
Footer: Unsubscribe + support
```

#### Payment Failed Email
```
Subject: Payment Issue - Action Required

Header: "Payment Update Needed"
Body:
- Grace period information
- Update payment method button
- Plan benefits at risk
- Support contact for help
Footer: Unsubscribe + support
```

## Implementation Guidelines

### Development Process
1. **Start with Core Service**: EmailService class and ZeptoMail provider
2. **Implement Welcome Email**: Test basic SMTP functionality
3. **Add Database Models**: Email logging and preferences
4. **Build Template System**: React email templates
5. **Integrate with Auth**: Welcome emails on signup
6. **Add Processing Emails**: Video workflow integration
7. **Implement Stripe Emails**: Subscription lifecycle
8. **Build Queue System**: Background processing
9. **Add Admin Interface**: Management dashboard
10. **Test Thoroughly**: All email types and edge cases

### Email Best Practices
- **Deliverability**: SPF, DKIM, DMARC records configured
- **Design**: Mobile-first, accessible, brand consistent
- **Content**: Clear, actionable, valuable
- **Compliance**: GDPR unsubscribe, CAN-SPAM compliant
- **Testing**: Preview mode, test accounts, A/B testing ready

### Error Handling
- SMTP connection failures
- Rate limiting from ZeptoMail
- Invalid email addresses
- Template rendering errors
- Queue processing failures

### Performance Requirements
- Async email sending (non-blocking)
- Efficient template rendering
- Queue processing optimization
- Database query efficiency
- Memory management for bulk emails

## Success Criteria

### Functional Requirements
- ✅ All email types send successfully via ZeptoMail SMTP
- ✅ Templates render correctly across email clients
- ✅ Integration works with existing auth, video processing, and Stripe
- ✅ Email preferences are respected
- ✅ Unsubscribe functionality works
- ✅ Email logs are properly recorded
- ✅ Queue system handles failures gracefully

### Technical Requirements
- ✅ Type-safe implementation with existing tRPC setup
- ✅ Follows existing codebase patterns and structure
- ✅ Proper error handling and logging
- ✅ Environment variables work in development and production
- ✅ Database migrations complete successfully
- ✅ Admin interface integrates with existing dashboard

### Business Requirements
- ✅ Plan-specific email content (Free, Starter, Creator, Producer)
- ✅ Usage tracking and quota notifications
- ✅ Subscription lifecycle emails drive retention
- ✅ Processing emails improve user experience
- ✅ Re-engagement emails reduce churn

## Constraints & Requirements
- Use existing Next.js 14 app structure
- Maintain type safety with tRPC
- Use ZeptoMail SMTP only
- Work with existing NextAuth.js setup (NEXTAUTH_SECRET, NEXTAUTH_URL)
- Integrate with current Stripe webhook system
- Support plan names: Free, Starter, Creator, Producer
- Domain: re-purpose.studio
- No trial period functionality needed

Build this system incrementally, starting with the ZeptoMail SMTP provider and welcome email, then expanding to all email types and advanced features.
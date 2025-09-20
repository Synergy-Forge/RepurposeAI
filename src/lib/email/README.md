# Repurpose AI Email System

A comprehensive transactional email system built with ZeptoMail SMTP for the Repurpose AI video repurposing SaaS application.

## Features

- ✅ ZeptoMail SMTP integration
- ✅ React-based email templates with TypeScript
- ✅ Comprehensive email type system
- ✅ Database logging and analytics
- ✅ User email preferences
- ✅ tRPC integration for email management
- ✅ Template rendering with modern HTML email best practices
- ✅ Mobile-responsive email design
- ✅ Dark mode support

## Architecture

```
src/lib/email/
├── index.ts                    # Main email service
├── providers/
│   ├── zeptomail.ts           # ZeptoMail SMTP client
│   └── index.ts               # Provider interface
├── templates/
│   ├── base/
│   │   ├── layout.tsx         # Base email layout
│   │   └── components.tsx     # Reusable email components
│   ├── auth/
│   │   ├── welcome.tsx
│   │   └── login-alert.tsx
│   ├── processing/
│   │   ├── started.tsx
│   │   ├── complete.tsx
│   │   ├── failed.tsx
│   │   └── quota.tsx
│   ├── subscription/
│   │   ├── created.tsx
│   │   ├── payment.tsx
│   │   └── cancelled.tsx
│   └── engagement/
│       ├── digest.tsx
│       └── announcement.tsx
├── types.ts                   # Email interfaces and types
├── smtp-types.ts              # SMTP-specific interfaces
├── config.ts                  # Configuration validation
├── renderer.ts                # Template rendering engine
└── utils.ts                   # Email utilities
```

## Email Types

### Authentication & Onboarding
- `welcome` - New user registration via Google OAuth
- `login-alert` - New device/location login notification

### Video Processing
- `processing-started` - Video upload and processing initiated
- `processing-complete` - Video clips ready with download links
- `processing-failed` - Processing error with support contact
- `quota-warning` - Approaching monthly processing limits
- `quota-exceeded` - Monthly limit reached

### Subscription Management
- `subscription-created` - Pro plan activation
- `payment-successful` - Monthly payment confirmation
- `payment-failed` - Payment retry notification
- `subscription-cancelled` - Cancellation confirmation
- `subscription-reactivated` - Plan reactivation
- `trial-ending` - Trial expiration reminder
- `downgrade-notice` - Pro to Free plan downgrade

### Engagement
- `weekly-digest` - Weekly video processing summary
- `feature-announcement` - New features and updates
- `inactivity-reminder` - Re-engagement for inactive users

## Usage

### Basic Email Sending

```typescript
import { createEmailService } from '@/lib/email';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const emailService = createEmailService(prisma);

// Send a welcome email
await emailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe',
  'https://app.repurposeai.com/dashboard',
  'user-id-123'
);
```

### Custom Email Data

```typescript
import { createEmailService } from '@/lib/email';
import { EMAIL_TYPES } from '@/lib/email/types';

const emailService = createEmailService(prisma);

await emailService.sendEmail({
  type: EMAIL_TYPES.PROCESSING_COMPLETE,
  to: 'user@example.com',
  subject: 'Your video is ready!',
  userName: 'John Doe',
  videoTitle: 'My Awesome Video',
  clipsCount: 3,
  downloadLinks: [
    { aspectRatio: '9:16', url: 'https://...' },
    { aspectRatio: '1:1', url: 'https://...' },
    { aspectRatio: '16:9', url: 'https://...' },
  ],
  dashboardUrl: 'https://app.repurposeai.com/dashboard',
}, {
  userId: 'user-id-123',
});
```

### Email Preferences

```typescript
// Get user preferences
const preferences = await ctx.prisma.emailPreference.findUnique({
  where: { userId: 'user-id-123' },
});

// Check if user wants processing updates
if (shouldSendEmail(EMAIL_TYPES.PROCESSING_COMPLETE, preferences)) {
  await emailService.sendEmail(/* ... */);
}
```

## Environment Variables

Add these to your `.env.local`:

```env
# ZeptoMail SMTP Configuration
ZEPTOMAIL_FROM_EMAIL="noreply@your-domain.com"
ZEPTOMAIL_SMTP_HOST="smtp.zeptomail.com"
ZEPTOMAIL_SMTP_PORT="587"
ZEPTOMAIL_SMTP_USER="your-smtp-username"
ZEPTOMAIL_SMTP_PASS="your-smtp-password"
FROM_NAME="Repurpose AI"
SUPPORT_EMAIL="support@your-domain.com"
```

## Database Models

### EmailLog
Tracks all sent emails with status, metadata, and analytics.

### EmailPreference
Stores user email preferences for different email types.

## tRPC Integration

The email system includes tRPC endpoints for:

- Email preference management
- Email history/logs
- Email statistics
- Test email sending (development)

```typescript
// Get email preferences
const preferences = await api.email.getPreferences.query();

// Update preferences
await api.email.updatePreferences.mutate({
  processingUpdates: false,
  marketingEmails: true,
});
```

## Development

### Email Preview
Use the preview method to test email templates:

```typescript
const html = await emailService.previewEmail({
  type: EMAIL_TYPES.WELCOME,
  to: 'test@example.com',
  subject: 'Test Welcome Email',
  userName: 'Test User',
  loginUrl: 'https://app.repurposeai.com/dashboard',
});
```

### Template Development
Email templates are React components that render to HTML. They support:

- Modern CSS with fallbacks
- Mobile-responsive design
- Dark mode support
- Dynamic content
- Reusable components

## Best Practices

1. **Always check user preferences** before sending non-essential emails
2. **Use appropriate email types** for different scenarios
3. **Include unsubscribe links** in marketing emails
4. **Test templates** across different email clients
5. **Monitor deliverability** through email logs
6. **Handle errors gracefully** with retry logic

## Migration from API-based System

The system has been updated from ZeptoMail REST API to SMTP for better reliability and performance. The new SMTP-based implementation:

- Uses nodemailer for SMTP transport
- Supports STARTTLS encryption
- Provides better error handling
- Maintains the same email service interface
- Uses environment variables for SMTP configuration

## SMTP Configuration Notes

- **Host**: `smtp.zeptomail.com`
- **Port**: `587` (STARTTLS)
- **Security**: STARTTLS is automatically handled
- **Authentication**: SMTP username and password from ZeptoMail
- **From Email**: Must be a verified domain in ZeptoMail

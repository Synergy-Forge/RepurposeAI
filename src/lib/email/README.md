# Email System Documentation

This directory contains the complete email system for Repurpose AI, including email providers, templates, queue management, and tRPC integration.

## Overview

The email system is designed to handle various types of emails including:
- Welcome emails for new users
- Processing notifications (start, complete, failed)
- Subscription-related emails (activation, upgrades, cancellations)
- Marketing emails and newsletters
- System notifications

## Architecture

### Core Components

1. **Email Providers** (`providers/`)
   - `ZeptoMailProvider`: SMTP-based email provider using ZeptoMail
   - Extensible interface for adding other providers (SendGrid, AWS SES, etc.)

2. **Email Service** (`index.ts`)
   - Main service class for sending emails
   - Template rendering and content generation
   - Integration with email queue

3. **Email Queue** (`queue.ts`)
   - Asynchronous email processing
   - Rate limiting and batch processing
   - Retry logic for failed emails

4. **Email Templates** (`templates/`)
   - React Email components for beautiful, responsive emails
   - Organized by category (auth, processing, subscription, etc.)
   - Base template with consistent branding

5. **tRPC Router** (`src/server/api/routers/email.ts`)
   - API endpoints for email management
   - Email preferences management
   - Email history and analytics

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# ZeptoMail SMTP Configuration
ZEPTOMAIL_FROM_EMAIL="noreply@yourdomain.com"
FROM_NAME="Your App Name"
SUPPORT_EMAIL="support@yourdomain.com"
WEBAPP_URL="https://yourdomain.com"

ZEPTOMAIL_SMTP_HOST="smtp.zeptomail.com"
ZEPTOMAIL_SMTP_PORT="587"
ZEPTOMAIL_SMTP_USER="your-zeptomail-username"
ZEPTOMAIL_SMTP_PASS="your-zeptomail-password"
```

### Database Schema

The email system requires these Prisma models:

```prisma
model EmailLog {
  id          String   @id @default(cuid())
  userId      String?
  email       String
  type        EmailType
  status      EmailStatus @default(QUEUED)
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

## Usage

### Basic Email Sending

```typescript
import { EmailService } from '@/lib/email';
import { EmailType } from '@/lib/email/types';

const emailService = new EmailService();

// Send welcome email
await emailService.sendWelcomeEmail(user);

// Send processing notification
await emailService.sendProcessingEmail('complete', userId, {
  title: 'My Video',
  duration: 300,
  clipsGenerated: 5,
  downloadUrl: 'https://...'
});

// Send subscription notification
await emailService.sendSubscriptionEmail('activated', userId, {
  planName: 'Creator',
  amount: 29,
  nextBillingDate: '2024-02-01'
});
```

### Using tRPC Endpoints

```typescript
// Get user email preferences
const preferences = await api.email.getUserPreferences.query();

// Update email preferences
await api.email.updatePreferences.mutate({
  marketingEmails: false,
  processingUpdates: true,
  weeklyDigest: true,
  featureAnnouncements: false
});

// Send test email
await api.email.testEmail.mutate({
  email: 'test@example.com'
});
```

## Email Templates

### Creating New Templates

1. Create a new component in the appropriate category folder
2. Use the `BaseTemplate` component for consistent styling
3. Export the component and add it to the email service

Example:

```tsx
// src/lib/email/templates/marketing/NewFeatureEmail.tsx
import React from 'react';
import { Section, Text, Button } from '@react-email/components';
import { BaseTemplate } from '../components/BaseTemplate';

export const NewFeatureEmail: React.FC<{ data: EmailTemplateData }> = ({ data }) => {
  return (
    <BaseTemplate>
      <Section>
        <Text>Check out our new features!</Text>
        <Button href="https://app.com/features">Learn More</Button>
      </Section>
    </BaseTemplate>
  );
};
```

### Template Categories

- **auth/**: Authentication-related emails (welcome, login alerts)
- **processing/**: Video processing notifications
- **subscription/**: Billing and subscription emails
- **engagement/**: Marketing and feature announcement emails
- **components/**: Reusable template components

## Queue Management

The email queue provides:

- **Rate limiting**: Prevents overwhelming the email provider
- **Batch processing**: Efficient handling of multiple emails
- **Retry logic**: Automatic retries for failed emails
- **Priority queuing**: Important emails sent first

## Monitoring and Analytics

### Email Logs

All emails are logged to the database with:
- Send status and timestamps
- Error messages for failed sends
- Metadata for debugging
- User association for analytics

### Queue Statistics

```typescript
const stats = await emailQueue.getQueueStats();
// Returns: { queued: 5, processing: 1, failed: 0, sent: 150 }
```

## Best Practices

1. **Template Design**
   - Keep emails mobile-responsive
   - Use clear, concise copy
   - Include unsubscribe links
   - Test across email clients

2. **Performance**
   - Use email queue for bulk sends
   - Implement rate limiting
   - Monitor delivery rates

3. **Compliance**
   - Include unsubscribe functionality
   - Respect user preferences
   - Follow email regulations (CAN-SPAM, GDPR)

4. **Error Handling**
   - Log all email failures
   - Implement retry mechanisms
   - Monitor bounce rates

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify SMTP credentials
   - Check firewall settings
   - Ensure correct SMTP host/port

2. **Template Rendering Issues**
   - Test templates in development
   - Check for missing props
   - Verify React Email compatibility

3. **Queue Backlog**
   - Monitor queue length
   - Check for stuck processing
   - Review rate limiting settings

### Debug Mode

Enable debug logging:

```typescript
const emailService = new EmailService();
// Debug logs will show email content and delivery status
```

## Extending the System

### Adding New Email Providers

1. Implement the `EmailProvider` interface
2. Add to the provider factory
3. Update configuration

### Custom Email Types

1. Add to `EmailType` enum
2. Create template component
3. Add to email service methods
4. Update tRPC router if needed

## Security Considerations

- Store SMTP credentials securely
- Validate email addresses
- Implement rate limiting
- Monitor for abuse
- Use HTTPS for webhooks

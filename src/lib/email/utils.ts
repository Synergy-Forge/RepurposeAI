import { type EmailType, EMAIL_TYPES } from './types';

/**
 * Check if a user should receive a specific type of email based on their preferences
 */
export function shouldSendEmail(
  emailType: EmailType,
  preferences: {
    marketingEmails: boolean;
    processingUpdates: boolean;
    weeklyDigest: boolean;
    featureAnnouncements: boolean;
  }
): boolean {
  switch (emailType) {
    case EMAIL_TYPES.WELCOME:
    case EMAIL_TYPES.LOGIN_ALERT:
      // These are essential emails, always send
      return true;

    case EMAIL_TYPES.PROCESSING_STARTED:
    case EMAIL_TYPES.PROCESSING_COMPLETE:
    case EMAIL_TYPES.PROCESSING_FAILED:
    case EMAIL_TYPES.QUOTA_WARNING:
    case EMAIL_TYPES.QUOTA_EXCEEDED:
      return preferences.processingUpdates;

    case EMAIL_TYPES.WEEKLY_DIGEST:
      return preferences.weeklyDigest;

    case EMAIL_TYPES.FEATURE_ANNOUNCEMENT:
      return preferences.featureAnnouncements;

    case EMAIL_TYPES.SUBSCRIPTION_CREATED:
    case EMAIL_TYPES.PAYMENT_SUCCESSFUL:
    case EMAIL_TYPES.PAYMENT_FAILED:
    case EMAIL_TYPES.SUBSCRIPTION_CANCELLED:
    case EMAIL_TYPES.SUBSCRIPTION_REACTIVATED:
    case EMAIL_TYPES.TRIAL_ENDING:
    case EMAIL_TYPES.DOWNGRADE_NOTICE:
      // Subscription emails are always sent as they're transactional
      return true;

    case EMAIL_TYPES.INACTIVITY_REMINDER:
      return preferences.marketingEmails;

    default:
      return true;
  }
}

/**
 * Get the priority level for an email type
 */
export function getEmailPriority(emailType: EmailType): 'low' | 'normal' | 'high' {
  switch (emailType) {
    case EMAIL_TYPES.PROCESSING_FAILED:
    case EMAIL_TYPES.PAYMENT_FAILED:
    case EMAIL_TYPES.QUOTA_EXCEEDED:
      return 'high';

    case EMAIL_TYPES.WELCOME:
    case EMAIL_TYPES.SUBSCRIPTION_CREATED:
    case EMAIL_TYPES.PAYMENT_SUCCESSFUL:
      return 'normal';

    default:
      return 'low';
  }
}

/**
 * Format email address for display
 */
export function formatEmailAddress(email: string, name?: string): string {
  if (name) {
    return `${name} <${email}>`;
  }
  return email;
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get email template subject line
 */
export function getEmailSubject(emailType: EmailType, customSubject?: string): string {
  if (customSubject) {
    return customSubject;
  }

  switch (emailType) {
    case EMAIL_TYPES.WELCOME:
      return 'Welcome to Repurpose AI!';
    case EMAIL_TYPES.LOGIN_ALERT:
      return 'Security Alert: New Login to Your Account';
    case EMAIL_TYPES.PROCESSING_STARTED:
      return 'Your Video Processing Has Started';
    case EMAIL_TYPES.PROCESSING_COMPLETE:
      return 'Your Video is Ready!';
    case EMAIL_TYPES.PROCESSING_FAILED:
      return 'Video Processing Failed';
    case EMAIL_TYPES.QUOTA_WARNING:
      return 'Approaching Your Monthly Limit';
    case EMAIL_TYPES.QUOTA_EXCEEDED:
      return 'Monthly Processing Limit Reached';
    case EMAIL_TYPES.SUBSCRIPTION_CREATED:
      return 'Welcome to Repurpose AI Pro!';
    case EMAIL_TYPES.PAYMENT_SUCCESSFUL:
      return 'Payment Successful';
    case EMAIL_TYPES.PAYMENT_FAILED:
      return 'Payment Failed';
    case EMAIL_TYPES.SUBSCRIPTION_CANCELLED:
      return 'Subscription Cancelled';
    case EMAIL_TYPES.SUBSCRIPTION_REACTIVATED:
      return 'Subscription Reactivated';
    case EMAIL_TYPES.TRIAL_ENDING:
      return 'Your Trial is Ending Soon';
    case EMAIL_TYPES.DOWNGRADE_NOTICE:
      return 'Plan Downgrade Scheduled';
    case EMAIL_TYPES.WEEKLY_DIGEST:
      return 'Your Weekly Repurpose AI Summary';
    case EMAIL_TYPES.FEATURE_ANNOUNCEMENT:
      return 'New Feature Available!';
    case EMAIL_TYPES.INACTIVITY_REMINDER:
      return 'We Miss You at Repurpose AI';
    default:
      return 'Repurpose AI Notification';
  }
}

/**
 * Get estimated processing time based on video duration
 */
export function getEstimatedProcessingTime(durationSeconds: number): string {
  // Simple estimation: assume 2x real-time processing
  const estimatedMinutes = Math.ceil(durationSeconds / 60 * 2);

  if (estimatedMinutes < 1) {
    return 'Less than 1 minute';
  } else if (estimatedMinutes === 1) {
    return 'About 1 minute';
  } else if (estimatedMinutes < 60) {
    return `About ${estimatedMinutes} minutes`;
  } else {
    const hours = Math.floor(estimatedMinutes / 60);
    const remainingMinutes = estimatedMinutes % 60;
    return `About ${hours}h ${remainingMinutes}m`;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get unsubscribe URL for email
 */
export function getUnsubscribeUrl(userId: string, emailType?: EmailType): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    userId,
    ...(emailType && { type: emailType }),
  });

  return `${baseUrl}/unsubscribe?${params.toString()}`;
}

/**
 * Get dashboard URL for user
 */
export function getDashboardUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Get support email address
 */
export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL || 'support@repurposeai.com';
}

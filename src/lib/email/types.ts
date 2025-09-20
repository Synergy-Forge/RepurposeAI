import { z } from 'zod';

// Email types enum
export const EMAIL_TYPES = {
  // Authentication & Onboarding
  WELCOME: 'welcome',
  LOGIN_ALERT: 'login-alert',

  // Video Processing
  PROCESSING_STARTED: 'processing-started',
  PROCESSING_COMPLETE: 'processing-complete',
  PROCESSING_FAILED: 'processing-failed',
  QUOTA_WARNING: 'quota-warning',
  QUOTA_EXCEEDED: 'quota-exceeded',

  // Subscription Management
  SUBSCRIPTION_CREATED: 'subscription-created',
  PAYMENT_SUCCESSFUL: 'payment-successful',
  PAYMENT_FAILED: 'payment-failed',
  SUBSCRIPTION_CANCELLED: 'subscription-cancelled',
  SUBSCRIPTION_REACTIVATED: 'subscription-reactivated',
  TRIAL_ENDING: 'trial-ending',
  DOWNGRADE_NOTICE: 'downgrade-notice',

  // Engagement
  WEEKLY_DIGEST: 'weekly-digest',
  FEATURE_ANNOUNCEMENT: 'feature-announcement',
  INACTIVITY_REMINDER: 'inactivity-reminder',
} as const;

export type EmailType = typeof EMAIL_TYPES[keyof typeof EMAIL_TYPES];

// Email status enum
export const EMAIL_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  BOUNCED: 'bounced',
  FAILED: 'failed',
} as const;

export type EmailStatus = typeof EMAIL_STATUS[keyof typeof EMAIL_STATUS];

// Base email data interface
export interface BaseEmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    content: string;
    name: string;
    type: string;
  }>;
}

// Email template data interfaces
export interface WelcomeEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.WELCOME;
  userName: string;
  loginUrl: string;
}

export interface LoginAlertEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.LOGIN_ALERT;
  userName: string;
  deviceInfo: string;
  location: string;
  loginTime: string;
}

export interface ProcessingStartedEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.PROCESSING_STARTED;
  userName: string;
  videoTitle: string;
  estimatedTime: string;
}

export interface ProcessingCompleteEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.PROCESSING_COMPLETE;
  userName: string;
  videoTitle: string;
  clipsCount: number;
  downloadLinks: Array<{
    aspectRatio: string;
    url: string;
  }>;
  dashboardUrl: string;
}

export interface ProcessingFailedEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.PROCESSING_FAILED;
  userName: string;
  videoTitle: string;
  errorMessage: string;
  supportEmail: string;
}

export interface QuotaWarningEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.QUOTA_WARNING;
  userName: string;
  currentUsage: number;
  limit: number;
  upgradeUrl: string;
}

export interface QuotaExceededEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.QUOTA_EXCEEDED;
  userName: string;
  upgradeUrl: string;
  nextResetDate: string;
}

export interface SubscriptionCreatedEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.SUBSCRIPTION_CREATED;
  userName: string;
  planName: string;
  amount: number;
  billingCycle: string;
  dashboardUrl: string;
}

export interface PaymentSuccessfulEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.PAYMENT_SUCCESSFUL;
  userName: string;
  amount: number;
  planName: string;
  invoiceUrl: string;
  nextBillingDate: string;
}

export interface PaymentFailedEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.PAYMENT_FAILED;
  userName: string;
  amount: number;
  planName: string;
  retryUrl: string;
}

export interface SubscriptionCancelledEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.SUBSCRIPTION_CANCELLED;
  userName: string;
  planName: string;
  cancellationDate: string;
  reactivateUrl: string;
}

export interface SubscriptionReactivatedEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.SUBSCRIPTION_REACTIVATED;
  userName: string;
  planName: string;
  nextBillingDate: string;
}

export interface TrialEndingEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.TRIAL_ENDING;
  userName: string;
  daysLeft: number;
  upgradeUrl: string;
}

export interface DowngradeNoticeEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.DOWNGRADE_NOTICE;
  userName: string;
  currentPlan: string;
  newPlan: string;
  downgradeDate: string;
  savings: number;
}

export interface WeeklyDigestEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.WEEKLY_DIGEST;
  userName: string;
  period: string;
  videosProcessed: number;
  clipsGenerated: number;
  totalWatchTime: string;
  topPerformingClip?: {
    aspectRatio: string;
    views: number;
  };
  dashboardUrl: string;
}

export interface FeatureAnnouncementEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.FEATURE_ANNOUNCEMENT;
  userName: string;
  featureTitle: string;
  featureDescription: string;
  featureUrl: string;
  ctaText: string;
}

export interface InactivityReminderEmailData extends BaseEmailData {
  type: typeof EMAIL_TYPES.INACTIVITY_REMINDER;
  userName: string;
  daysInactive: number;
  dashboardUrl: string;
  featureHighlight: string;
}

// Union type for all email data
export type EmailData =
  | WelcomeEmailData
  | LoginAlertEmailData
  | ProcessingStartedEmailData
  | ProcessingCompleteEmailData
  | ProcessingFailedEmailData
  | QuotaWarningEmailData
  | QuotaExceededEmailData
  | SubscriptionCreatedEmailData
  | PaymentSuccessfulEmailData
  | PaymentFailedEmailData
  | SubscriptionCancelledEmailData
  | SubscriptionReactivatedEmailData
  | TrialEndingEmailData
  | DowngradeNoticeEmailData
  | WeeklyDigestEmailData
  | FeatureAnnouncementEmailData
  | InactivityReminderEmailData;

// Zod schemas for validation
export const emailDataSchemas: Record<EmailType, z.ZodSchema> = {
  [EMAIL_TYPES.WELCOME]: z.object({
    type: z.literal(EMAIL_TYPES.WELCOME),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    loginUrl: z.string().url(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.LOGIN_ALERT]: z.object({
    type: z.literal(EMAIL_TYPES.LOGIN_ALERT),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    deviceInfo: z.string(),
    location: z.string(),
    loginTime: z.string(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.PROCESSING_STARTED]: z.object({
    type: z.literal(EMAIL_TYPES.PROCESSING_STARTED),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    videoTitle: z.string(),
    estimatedTime: z.string(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.PROCESSING_COMPLETE]: z.object({
    type: z.literal(EMAIL_TYPES.PROCESSING_COMPLETE),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    videoTitle: z.string(),
    clipsCount: z.number(),
    downloadLinks: z.array(z.object({
      aspectRatio: z.string(),
      url: z.string().url(),
    })),
    dashboardUrl: z.string().url(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.PROCESSING_FAILED]: z.object({
    type: z.literal(EMAIL_TYPES.PROCESSING_FAILED),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    videoTitle: z.string(),
    errorMessage: z.string(),
    supportEmail: z.string().email(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.QUOTA_WARNING]: z.object({
    type: z.literal(EMAIL_TYPES.QUOTA_WARNING),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    currentUsage: z.number(),
    limit: z.number(),
    upgradeUrl: z.string().url(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.QUOTA_EXCEEDED]: z.object({
    type: z.literal(EMAIL_TYPES.QUOTA_EXCEEDED),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    upgradeUrl: z.string().url(),
    nextResetDate: z.string(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.SUBSCRIPTION_CREATED]: z.object({
    type: z.literal(EMAIL_TYPES.SUBSCRIPTION_CREATED),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    planName: z.string(),
    amount: z.number(),
    billingCycle: z.string(),
    dashboardUrl: z.string().url(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.PAYMENT_SUCCESSFUL]: z.object({
    type: z.literal(EMAIL_TYPES.PAYMENT_SUCCESSFUL),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    amount: z.number(),
    planName: z.string(),
    invoiceUrl: z.string().url(),
    nextBillingDate: z.string(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.PAYMENT_FAILED]: z.object({
    type: z.literal(EMAIL_TYPES.PAYMENT_FAILED),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    amount: z.number(),
    planName: z.string(),
    retryUrl: z.string().url(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.SUBSCRIPTION_CANCELLED]: z.object({
    type: z.literal(EMAIL_TYPES.SUBSCRIPTION_CANCELLED),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    planName: z.string(),
    cancellationDate: z.string(),
    reactivateUrl: z.string().url(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.SUBSCRIPTION_REACTIVATED]: z.object({
    type: z.literal(EMAIL_TYPES.SUBSCRIPTION_REACTIVATED),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    planName: z.string(),
    nextBillingDate: z.string(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.TRIAL_ENDING]: z.object({
    type: z.literal(EMAIL_TYPES.TRIAL_ENDING),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    daysLeft: z.number(),
    upgradeUrl: z.string().url(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.DOWNGRADE_NOTICE]: z.object({
    type: z.literal(EMAIL_TYPES.DOWNGRADE_NOTICE),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    currentPlan: z.string(),
    newPlan: z.string(),
    downgradeDate: z.string(),
    savings: z.number(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.WEEKLY_DIGEST]: z.object({
    type: z.literal(EMAIL_TYPES.WEEKLY_DIGEST),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    period: z.string(),
    videosProcessed: z.number(),
    clipsGenerated: z.number(),
    totalWatchTime: z.string(),
    dashboardUrl: z.string().url(),
    topPerformingClip: z.object({
      aspectRatio: z.string(),
      views: z.number(),
    }).optional(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.FEATURE_ANNOUNCEMENT]: z.object({
    type: z.literal(EMAIL_TYPES.FEATURE_ANNOUNCEMENT),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    featureTitle: z.string(),
    featureDescription: z.string(),
    featureUrl: z.string().url(),
    ctaText: z.string(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),

  [EMAIL_TYPES.INACTIVITY_REMINDER]: z.object({
    type: z.literal(EMAIL_TYPES.INACTIVITY_REMINDER),
    to: z.string().email(),
    subject: z.string(),
    userName: z.string(),
    daysInactive: z.number(),
    dashboardUrl: z.string().url(),
    featureHighlight: z.string(),
    html: z.string().optional(),
    text: z.string().optional(),
  }),
};

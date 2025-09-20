export enum EmailType {
  WELCOME = 'WELCOME',
  LOGIN_ALERT = 'LOGIN_ALERT',
  PROCESSING_STARTED = 'PROCESSING_STARTED',
  PROCESSING_COMPLETE = 'PROCESSING_COMPLETE',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  QUOTA_WARNING = 'QUOTA_WARNING',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SUBSCRIPTION_ACTIVATED = 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_UPGRADED = 'SUBSCRIPTION_UPGRADED',
  SUBSCRIPTION_DOWNGRADED = 'SUBSCRIPTION_DOWNGRADED',
  PAYMENT_SUCCESSFUL = 'PAYMENT_SUCCESSFUL',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  DOWNGRADE_TO_FREE = 'DOWNGRADE_TO_FREE',
  WEEKLY_DIGEST = 'WEEKLY_DIGEST',
  FEATURE_ANNOUNCEMENT = 'FEATURE_ANNOUNCEMENT',
  REACTIVATION = 'REACTIVATION',
}

export enum EmailStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
}

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

export interface QueuedEmail {
  id: string;
  userId: string;
  email: string;
  type: EmailType;
  data: EmailTemplateData;
  scheduledFor?: Date;
  priority?: number;
}

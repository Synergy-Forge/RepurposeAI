import { createEmailService } from './index';
import { shouldSendEmail } from './utils';
import { EMAIL_TYPES } from './types';
import { PrismaClient } from '@prisma/client';

/**
 * Integration functions for sending emails at key application events
 */

export async function sendWelcomeEmailOnSignIn(
  user: {
    id: string;
    email: string;
    name?: string | null;
  }
) {
  try {
    const prisma = new PrismaClient();
    const emailService = createEmailService(prisma);

    // Check if user has email preferences and wants welcome emails
    const preferences = await prisma.emailPreference.findUnique({
      where: { userId: user.id },
    });

    // Welcome emails are essential, so we send them unless explicitly disabled
    const shouldSend = preferences ? shouldSendEmail(EMAIL_TYPES.WELCOME, preferences) : true;

    if (shouldSend && user.email) {
      await emailService.sendWelcomeEmail(
        user.email,
        user.name || 'User',
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
        user.id
      );
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to send welcome email on sign-in:', error);
    // Don't throw - this shouldn't break the sign-in process
  }
}

export async function sendProcessingCompleteEmail(
  userId: string,
  videoTitle: string,
  clipsCount: number,
  downloadLinks: Array<{
    aspectRatio: string;
    url: string;
  }>
) {
  try {
    const prisma = new PrismaClient();
    const emailService = createEmailService(prisma);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      throw new Error('User email not found');
    }

    // Check email preferences
    const preferences = await prisma.emailPreference.findUnique({
      where: { userId },
    });

    const shouldSend = preferences
      ? shouldSendEmail(EMAIL_TYPES.PROCESSING_COMPLETE, preferences)
      : true;

    if (shouldSend) {
      await emailService.sendProcessingCompleteEmail(
        user.email,
        user.name || 'User',
        videoTitle,
        clipsCount,
        downloadLinks,
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
        userId
      );
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to send processing complete email:', error);
    throw error; // Re-throw for processing pipeline to handle
  }
}

export async function sendSubscriptionCreatedEmail(
  userId: string,
  planName: string,
  amount: number,
  billingCycle: string
) {
  try {
    const prisma = new PrismaClient();
    const emailService = createEmailService(prisma);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      throw new Error('User email not found');
    }

    // Subscription emails are always sent as they're transactional
    await emailService.sendEmail({
      type: EMAIL_TYPES.SUBSCRIPTION_CREATED,
      to: user.email,
      subject: `Welcome to ${planName}!`,
      userName: user.name || 'User',
      planName,
      amount,
      billingCycle,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
    }, { userId });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to send subscription created email:', error);
    throw error;
  }
}

export async function sendPaymentFailedEmail(
  userId: string,
  planName: string,
  amount: number,
  retryUrl: string
) {
  try {
    const prisma = new PrismaClient();
    const emailService = createEmailService(prisma);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      throw new Error('User email not found');
    }

    // Payment failed emails are always sent as they're critical
    await emailService.sendEmail({
      type: EMAIL_TYPES.PAYMENT_FAILED,
      to: user.email,
      subject: 'Payment Failed - Action Required',
      userName: user.name || 'User',
      amount,
      planName,
      retryUrl,
    }, { userId });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
    throw error;
  }
}

/**
 * Initialize email preferences for new users
 */
export async function initializeEmailPreferences(userId: string) {
  try {
    const prisma = new PrismaClient();

    // Check if preferences already exist
    const existing = await prisma.emailPreference.findUnique({
      where: { userId },
    });

    if (!existing) {
      await prisma.emailPreference.create({
        data: {
          userId,
          marketingEmails: true,
          processingUpdates: true,
          weeklyDigest: true,
          featureAnnouncements: true,
        },
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to initialize email preferences:', error);
    // Don't throw - this is not critical
  }
}

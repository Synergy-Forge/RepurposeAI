import { createEmailService } from './email';
import { PrismaClient } from '@prisma/client';

// Legacy function for backward compatibility
// This will be deprecated in favor of the new EmailService
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  console.warn('Using deprecated sendEmail function. Please use EmailService instead.');

  try {
    const prisma = new PrismaClient();
    const emailService = createEmailService(prisma);

    // Create a basic email data object - using a generic approach for legacy compatibility
    const emailData = {
      to,
      subject,
      text,
      html,
      type: 'welcome' as any, // Using welcome as a generic type
      userName: 'User', // Required field for most email types
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
    };

    const messageId = await emailService.sendEmail(emailData);
    await prisma.$disconnect();

    console.log('Email sent:', messageId);
    return { success: true, messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

// Export the new email service as the default
export { createEmailService } from './email/index';
export { EMAIL_TYPES } from './email/types';
export type { EmailData, EmailType } from './email/types';

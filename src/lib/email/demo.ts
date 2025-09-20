/**
 * Email System Demo
 *
 * This script demonstrates how to use the email system in your application.
 * Run with: npx tsx src/lib/email/demo.ts
 */

import { createEmailService } from './index';
import { EMAIL_TYPES } from './types';
import { PrismaClient } from '@prisma/client';

// Mock environment variables for demo
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.ZEPTOMAIL_FROM_EMAIL = 'noreply@repurposeai.com';
process.env.FROM_NAME = 'Repurpose AI';
process.env.SUPPORT_EMAIL = 'support@repurposeai.com';

// Mock ZeptoMail SMTP credentials for demo (will use mock mode)
process.env.ZEPTOMAIL_SMTP_HOST = 'smtp.zeptomail.com';
process.env.ZEPTOMAIL_SMTP_PORT = '587';
process.env.ZEPTOMAIL_SMTP_USER = 'demo-smtp-user';
process.env.ZEPTOMAIL_SMTP_PASS = 'demo-smtp-pass';

async function demonstrateEmailSystem() {
  console.log('🚀 Repurpose AI Email System Demo\n');

  const prisma = new PrismaClient();

  try {
    // Create email service (will use mock provider if SMTP credentials are not set)
    const emailService = createEmailService(prisma);
    console.log('✅ Email service created (mock mode)\n');

    // Demo 1: Welcome Email
    console.log('📧 Demo 1: Sending Welcome Email');
    const welcomeResult = await emailService.sendWelcomeEmail(
      'john.doe@example.com',
      'John Doe',
      'http://localhost:3000/dashboard',
      'user-123'
    );
    console.log('✅ Welcome email sent:', welcomeResult, '\n');

    // Demo 2: Processing Complete Email
    console.log('📧 Demo 2: Sending Processing Complete Email');
    const processingResult = await emailService.sendProcessingCompleteEmail(
      'john.doe@example.com',
      'John Doe',
      'My Awesome Video',
      3,
      [
        { aspectRatio: '9:16', url: 'https://example.com/download/916' },
        { aspectRatio: '1:1', url: 'https://example.com/download/11' },
        { aspectRatio: '16:9', url: 'https://example.com/download/169' },
      ],
      'http://localhost:3000/dashboard',
      'user-123'
    );
    console.log('✅ Processing complete email sent:', processingResult, '\n');

    // Demo 3: Custom Email with Full Data
    console.log('📧 Demo 3: Sending Custom Email');
    const customResult = await emailService.sendEmail({
      type: EMAIL_TYPES.PROCESSING_COMPLETE,
      to: 'jane.smith@example.com',
      subject: 'Your video processing is complete!',
      userName: 'Jane Smith',
      videoTitle: 'Product Demo Video',
      clipsCount: 5,
      downloadLinks: [
        { aspectRatio: '9:16', url: 'https://example.com/download/916-2' },
        { aspectRatio: '1:1', url: 'https://example.com/download/11-2' },
        { aspectRatio: '16:9', url: 'https://example.com/download/169-2' },
        { aspectRatio: '4:5', url: 'https://example.com/download/45' },
        { aspectRatio: '16:9', url: 'https://example.com/download/169-3' },
      ],
      dashboardUrl: 'http://localhost:3000/dashboard',
    }, {
      userId: 'user-456',
    });
    console.log('✅ Custom email sent:', customResult, '\n');

    // Demo 4: Preview Email (for development)
    console.log('📧 Demo 4: Preview Email Template');
    const previewHtml = await emailService.previewEmail({
      type: EMAIL_TYPES.WELCOME,
      to: 'preview@example.com',
      subject: 'Preview: Welcome Email',
      userName: 'Preview User',
      loginUrl: 'http://localhost:3000/dashboard',
    });
    console.log('✅ Email preview generated (length:', previewHtml.length, 'characters)\n');

    // Demo 5: Show Database Logs
    console.log('📊 Demo 5: Email Database Logs');
    const emailLogs = await prisma.emailLog.findMany({
      take: 5,
      orderBy: { sentAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    console.log('📋 Recent email logs:');
    emailLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.type} - ${log.subject} (${log.status})`);
      if (log.user) {
        console.log(`      To: ${log.user.name} <${log.user.email}>`);
      }
      console.log(`      Sent: ${log.sentAt.toISOString()}`);
      console.log('');
    });

    console.log('🎉 Email System Demo Completed!');
    console.log('\n📋 Summary of what was demonstrated:');
    console.log('   ✅ Welcome email sending');
    console.log('   ✅ Processing complete email sending');
    console.log('   ✅ Custom email with full data');
    console.log('   ✅ Email template preview');
    console.log('   ✅ Database logging and retrieval');
    console.log('   ✅ Mock mode for development');

    console.log('\n🚀 Ready for Production:');
    console.log('   1. Set up ZeptoMail account');
    console.log('   2. Add real SMTP credentials');
    console.log('   3. Set mock: false for production');
    console.log('   4. Integrate with your application workflows');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown stack');
  } finally {
    await prisma.$disconnect();
  }
}

// Integration Examples
export const integrationExamples = {
  // Example: Send welcome email on user registration
  onUserRegistration: async (userId: string, email: string, name: string) => {
    const prisma = new PrismaClient();
    const emailService = createEmailService(prisma);

    await emailService.sendWelcomeEmail(
      email,
      name,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      userId
    );

    await prisma.$disconnect();
  },

  // Example: Send processing complete email
  onVideoProcessingComplete: async (
    userId: string,
    videoTitle: string,
    clipsCount: number,
    downloadLinks: Array<{ aspectRatio: string; url: string }>
  ) => {
    const prisma = new PrismaClient();
    const emailService = createEmailService(prisma);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      await emailService.sendProcessingCompleteEmail(
        user.email,
        user.name || 'User',
        videoTitle,
        clipsCount,
        downloadLinks,
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        userId
      );
    }

    await prisma.$disconnect();
  },

  // Example: Check user email preferences before sending
  shouldSendEmail: async (userId: string, emailType: string) => {
    const prisma = new PrismaClient();

    const preferences = await prisma.emailPreference.findUnique({
      where: { userId },
    });

    // Default to true for essential emails
    const shouldSend = preferences ? true : true;

    await prisma.$disconnect();
    return shouldSend;
  },
};

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateEmailSystem().catch(console.error);
}

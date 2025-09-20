/**
 * Simple Email System Test
 *
 * This script tests the email system components without requiring API keys.
 * Run with: npx tsx src/lib/email/test-simple.ts
 */

import { createEmailRenderer } from './renderer';
import { EMAIL_TYPES } from './types';
import { WelcomeEmail } from './templates/auth/welcome';
import { ProcessingCompleteEmail } from './templates/processing/complete';
import { PrismaClient } from '@prisma/client';
import { MockEmailProvider } from './providers/mock';

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

async function testEmailSystem() {
  console.log('🧪 Testing Repurpose AI Email System (Simple Mode)\n');

  const prisma = new PrismaClient();

  try {
    // Test 1: Email Renderer
    console.log('📧 Test 1: Email Renderer');
    const renderer = createEmailRenderer();
    console.log('✅ Email renderer created');

    // Test 2: Welcome Email Template
    console.log('\n📧 Test 2: Welcome Email Template');
    const welcomeHtml = await renderer.render(WelcomeEmail, {
      userName: 'John Doe',
      loginUrl: 'http://localhost:3000/dashboard',
    });
    console.log('✅ Welcome email rendered successfully');
    console.log('📄 HTML length:', welcomeHtml.length, 'characters');

    // Test 3: Processing Complete Email Template
    console.log('\n📧 Test 3: Processing Complete Email Template');
    const processingHtml = await renderer.render(ProcessingCompleteEmail, {
      userName: 'John Doe',
      videoTitle: 'My Awesome Video',
      clipsCount: 3,
      downloadLinks: [
        { aspectRatio: '9:16', url: 'https://example.com/download/916' },
        { aspectRatio: '1:1', url: 'https://example.com/download/11' },
        { aspectRatio: '16:9', url: 'https://example.com/download/169' },
      ],
      dashboardUrl: 'http://localhost:3000/dashboard',
    });
    console.log('✅ Processing complete email rendered successfully');
    console.log('📄 HTML length:', processingHtml.length, 'characters');

    // Test 4: Mock Email Provider
    console.log('\n📧 Test 4: Mock Email Provider');
    const mockProvider = new MockEmailProvider();

    const messageId = await mockProvider.sendEmail(
      'test@example.com',
      'Test Email Subject',
      {
        html: '<h1>Test Email</h1><p>This is a test email.</p>',
        text: 'Test Email - This is a test email.',
      }
    );
    console.log('✅ Mock email sent successfully');
    console.log('📧 Message ID:', messageId);

    // Test 5: Database Integration
    console.log('\n🗄️ Test 5: Database Integration');

    // Create test user if not exists
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          subscriptionStatus: 'free',
        },
      });
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user found');
    }

    // Create email preferences
    const preferences = await prisma.emailPreference.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        marketingEmails: true,
        processingUpdates: true,
        weeklyDigest: true,
        featureAnnouncements: true,
      },
    });
    console.log('✅ Email preferences created');

    // Create email log entry
    const emailLog = await prisma.emailLog.create({
      data: {
        userId: testUser.id,
        email: 'test@example.com',
        type: EMAIL_TYPES.WELCOME,
        status: 'sent',
        subject: 'Test Welcome Email',
        metadata: {
          messageId: messageId,
          templateVersion: '1.0.0',
        },
      },
    });
    console.log('✅ Email log entry created:', emailLog.id);

    // Test 6: Email Statistics
    console.log('\n📊 Test 6: Email Statistics');
    const stats = await prisma.emailLog.groupBy({
      by: ['status'],
      where: { userId: testUser.id },
      _count: {
        status: true,
      },
    });

    console.log('📊 Email statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.status}`);
    });

    // Test 7: Show Sample HTML Output
    console.log('\n📄 Test 7: Sample Email HTML Output');
    console.log('Welcome Email Preview (first 300 chars):');
    console.log(welcomeHtml.substring(0, 300) + '...');
    console.log('\nProcessing Email Preview (first 300 chars):');
    console.log(processingHtml.substring(0, 300) + '...');

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Email renderer creation');
    console.log('   ✅ Welcome email template rendering');
    console.log('   ✅ Processing complete email template rendering');
    console.log('   ✅ Mock email provider');
    console.log('   ✅ Database user and preferences');
    console.log('   ✅ Email logging functionality');
    console.log('   ✅ Email statistics');
    console.log('   ✅ Email HTML generation');

    console.log('\n🚀 The email system is ready for use!');
    console.log('\n💡 To test with real email sending:');
    console.log('   1. Set up ZeptoMail account and get SMTP credentials');
    console.log('   2. Add environment variables: ZEPTOMAIL_FROM_EMAIL, ZEPTOMAIL_SMTP_HOST, ZEPTOMAIL_SMTP_PORT, ZEPTOMAIL_SMTP_USER, ZEPTOMAIL_SMTP_PASS');
    console.log('   3. Use ZeptoMailProvider instead of MockEmailProvider');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown stack');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailSystem().catch(console.error);
}

export { testEmailSystem };

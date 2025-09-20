import { EmailService } from './index';
import { EmailType } from './types';

/**
 * Test script for the email system
 * Run with: npx tsx src/lib/email/test-email.ts
 */

async function testEmailSystem() {
  console.log('🧪 Testing Email System...\n');

  const emailService = new EmailService();

  // Test data
  const testData = {
    user: {
      name: 'Test User',
      email: 'test@example.com',
      plan: 'Free' as const,
    },
    unsubscribeUrl: 'https://re-purpose.studio/unsubscribe',
    supportUrl: 'mailto:support@re-purpose.studio',
  };

  try {
    // Test welcome email
    console.log('📧 Testing welcome email...');
    const welcomeResult = await emailService.sendEmail(EmailType.WELCOME, 'test-user-id', testData);
    console.log('Welcome email result:', welcomeResult ? '✅ Success' : '❌ Failed');

    // Test processing complete email
    console.log('📧 Testing processing complete email...');
    const processingData = {
      ...testData,
      video: {
        title: 'Test Video',
        duration: 300,
        clipsGenerated: 5,
        downloadUrl: 'https://re-purpose.studio/download/test',
      },
    };
    const processingResult = await emailService.sendEmail(EmailType.PROCESSING_COMPLETE, 'test-user-id', processingData);
    console.log('Processing email result:', processingResult ? '✅ Success' : '❌ Failed');

    // Test subscription email
    console.log('📧 Testing subscription email...');
    const subscriptionData = {
      ...testData,
      subscription: {
        planName: 'Creator',
        amount: 29,
        nextBillingDate: '2024-02-01',
      },
    };
    const subscriptionResult = await emailService.sendEmail(EmailType.SUBSCRIPTION_ACTIVATED, 'test-user-id', subscriptionData);
    console.log('Subscription email result:', subscriptionResult ? '✅ Success' : '❌ Failed');

    console.log('\n🎉 Email system test completed!');
    console.log('📝 Check the console logs above for detailed results.');
    console.log('⚠️  Make sure your email configuration is set up correctly in .env.local');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailSystem();
}

export { testEmailSystem };

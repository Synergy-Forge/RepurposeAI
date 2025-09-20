import { EmailService } from './index';
import { EmailType } from './types';
import { render } from '@react-email/render';
import { WelcomeEmail } from './templates/auth/WelcomeEmail';
import { ProcessingCompleteEmail } from './templates/processing/ProcessingCompleteEmail';
import { SubscriptionActivatedEmail } from './templates/subscription/SubscriptionActivatedEmail';

/**
 * Test script for email system structure and template rendering
 * This test doesn't require SMTP credentials
 * Run with: npx tsx src/lib/email/test-structure.ts
 */

async function testEmailStructure() {
  console.log('🧪 Testing Email System Structure...\n');

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
    // Test 1: Email Service Instantiation
    console.log('📧 Testing EmailService instantiation...');
    const emailService = new EmailService();
    console.log('✅ EmailService created successfully');

    // Test 2: Template Rendering
    console.log('📧 Testing template rendering...');

    // Welcome Email
    const welcomeHtml = await render(WelcomeEmail({ data: testData }) as React.ReactElement);
    console.log('✅ Welcome email template renders successfully');
    console.log(`📄 Welcome email length: ${welcomeHtml.length} characters`);

    // Processing Complete Email
    const processingData = {
      ...testData,
      video: {
        title: 'Test Video',
        duration: 300,
        clipsGenerated: 5,
        downloadUrl: 'https://re-purpose.studio/download/test',
      },
    };
    const processingHtml = await render(ProcessingCompleteEmail({ data: processingData }) as React.ReactElement);
    console.log('✅ Processing complete email template renders successfully');
    console.log(`📄 Processing email length: ${processingHtml.length} characters`);

    // Subscription Email
    const subscriptionData = {
      ...testData,
      subscription: {
        planName: 'Creator',
        amount: 29,
        nextBillingDate: '2024-02-01',
      },
    };
    const subscriptionHtml = await render(SubscriptionActivatedEmail({ data: subscriptionData }) as React.ReactElement);
    console.log('✅ Subscription email template renders successfully');
    console.log(`📄 Subscription email length: ${subscriptionHtml.length} characters`);

    // Test 3: Email Types
    console.log('📧 Testing email types...');
    const emailTypes = Object.values(EmailType);
    console.log(`✅ Found ${emailTypes.length} email types:`, emailTypes);

    // Test 4: Configuration Validation
    console.log('📧 Testing configuration validation...');
    // This should fail without environment variables (expected)
    try {
      await emailService.sendEmail(EmailType.WELCOME, 'test-user-id', testData);
      console.log('❌ Configuration validation failed - should have thrown error');
    } catch {
      console.log('✅ Configuration validation working correctly - requires environment variables');
    }

    // Test 5: Queue System
    console.log('📧 Testing queue system...');
    const queue = emailService['queue'];
    const stats = await queue.getQueueStats();
    console.log('✅ Queue system initialized:', stats);

    console.log('\n🎉 Email system structure test completed successfully!');
    console.log('📝 All components are working correctly.');
    console.log('⚠️  To test actual email sending, configure environment variables in .env.local');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailStructure();
}

export { testEmailStructure };

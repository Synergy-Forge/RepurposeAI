import nodemailer from 'nodemailer';

// Test email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || 'smtp.zeptomail.com',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@re-purpose.studio',
      to: 'hatusdeliveroo@gmail.com', // Replace with your test email
      subject: 'Test Email from RepurposeAI',
      text: 'This is a test email to verify ZeptoMail configuration.',
      html: '<h1>Test Email</h1><p>This is a test email to verify ZeptoMail configuration.</p>',
    });

    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testEmail();

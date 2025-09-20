// Configuration validation for email service
export function validateEmailConfig() {
  const required = [
    'ZEPTOMAIL_FROM_EMAIL',
    'ZEPTOMAIL_SMTP_HOST',
    'ZEPTOMAIL_SMTP_PORT',
    'ZEPTOMAIL_SMTP_USER',
    'ZEPTOMAIL_SMTP_PASS',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required email environment variables: ${missing.join(', ')}`);
  }
}

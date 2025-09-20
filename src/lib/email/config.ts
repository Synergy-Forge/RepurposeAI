import { z } from 'zod';

const emailConfigSchema = z.object({
  fromEmail: z.string().email(),
  fromName: z.string(),
  supportEmail: z.string().email(),
  webappUrl: z.string().url(),
  smtp: z.object({
    host: z.string(),
    port: z.number(),
    user: z.string(),
    pass: z.string(),
  }),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;

export function getEmailConfig(): EmailConfig {
  const config = emailConfigSchema.parse({
    fromEmail: process.env.ZEPTOMAIL_FROM_EMAIL!,
    fromName: process.env.FROM_NAME || 'Repurpose AI',
    supportEmail: process.env.SUPPORT_EMAIL!,
    webappUrl: process.env.WEBAPP_URL!,
    smtp: {
      host: process.env.ZEPTOMAIL_SMTP_HOST!,
      port: parseInt(process.env.ZEPTOMAIL_SMTP_PORT!),
      user: process.env.ZEPTOMAIL_SMTP_USER!,
      pass: process.env.ZEPTOMAIL_SMTP_PASS!,
    },
  });

  return config;
}

export const EMAIL_CONSTANTS = {
  BRAND: {
    name: 'Repurpose AI',
    domain: 're-purpose.studio',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#FF6B35',
    },
  },
  UNSUBSCRIBE_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  RATE_LIMITS: {
    perMinute: 60,
    perHour: 1000,
  },
} as const;

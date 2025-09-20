import nodemailer from 'nodemailer';
import { EmailOptions, EmailProvider } from '../smtp-types';

export class ZeptoMailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.ZEPTOMAIL_SMTP_HOST!,
      port: parseInt(process.env.ZEPTOMAIL_SMTP_PORT!),
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.ZEPTOMAIL_SMTP_USER!,
        pass: process.env.ZEPTOMAIL_SMTP_PASS!,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
    });
  }

  async send(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Repurpose AI',
          address: process.env.ZEPTOMAIL_FROM_EMAIL!,
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || process.env.SUPPORT_EMAIL,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('ZeptoMail SMTP Error:', error);
      return false;
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('ZeptoMail SMTP Connection Error:', error);
      return false;
    }
  }
}

// Factory function to create ZeptoMail provider instance
export function createZeptoMailProvider(): ZeptoMailProvider {
  const requiredEnvVars = [
    'ZEPTOMAIL_FROM_EMAIL',
    'ZEPTOMAIL_SMTP_HOST',
    'ZEPTOMAIL_SMTP_PORT',
    'ZEPTOMAIL_SMTP_USER',
    'ZEPTOMAIL_SMTP_PASS',
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required ZeptoMail SMTP environment variables: ${missing.join(', ')}`);
  }

  return new ZeptoMailProvider();
}

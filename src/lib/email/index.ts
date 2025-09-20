import { createZeptoMailProvider } from './providers';
import { createEmailRenderer } from './renderer';
import { EMAIL_TYPES, type EmailData, type EmailType } from './types';
import { WelcomeEmail } from './templates/auth/welcome';
import { ProcessingCompleteEmail } from './templates/processing/complete';
import { PrismaClient } from '@prisma/client';

interface EmailServiceConfig {
  prisma: PrismaClient;
  baseUrl?: string;
}

interface SendEmailOptions {
  userId?: string;
  priority?: 'low' | 'normal' | 'high';
  scheduledFor?: Date;
}

export class EmailService {
  private provider;
  private renderer;
  private prisma: PrismaClient;

  constructor(config: EmailServiceConfig) {
    this.provider = createZeptoMailProvider();
    this.renderer = createEmailRenderer(config.baseUrl);
    this.prisma = config.prisma;
  }

  async sendEmail(
    emailData: EmailData,
    options: SendEmailOptions = {}
  ): Promise<string> {
    try {
      // Validate email data
      const validatedData = this.validateEmailData(emailData);

      // Render template to HTML
      const html = await this.renderTemplate(validatedData);

      // Send email via ZeptoMail SMTP
      const success = await this.provider.send({
        to: validatedData.to,
        subject: validatedData.subject,
        html,
        text: validatedData.text,
      });

      if (!success) {
        throw new Error('Failed to send email via SMTP');
      }

      // Log email in database
      await this.logEmail({
        userId: options.userId,
        email: validatedData.to,
        type: validatedData.type,
        status: 'sent',
        subject: validatedData.subject,
      });

      return 'sent'; // SMTP doesn't return message IDs like API-based services
    } catch (error) {
      console.error('Failed to send email:', error);

      // Log failed email
      if (options.userId) {
        await this.logEmail({
          userId: options.userId,
          email: emailData.to,
          type: emailData.type,
          status: 'failed',
          subject: emailData.subject,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      throw error;
    }
  }

  async sendBulkEmails(
    emails: Array<EmailData & SendEmailOptions>
  ): Promise<string[]> {
    const results: string[] = [];

    for (const email of emails) {
      try {
        const messageId = await this.sendEmail(email, {
          userId: email.userId,
          priority: email.priority,
          scheduledFor: email.scheduledFor,
        });
        results.push(messageId);
      } catch (error) {
        console.error('Failed to send bulk email:', error);
        results.push('failed');
      }
    }

    return results;
  }

  private validateEmailData(emailData: EmailData): EmailData {
    // Basic validation - in production, use Zod schemas
    if (!emailData.to || !emailData.subject) {
      throw new Error('Email data must include "to" and "subject" fields');
    }

    return emailData;
  }

  private async renderTemplate(emailData: EmailData): Promise<string> {
    const { type, ...props } = emailData;

    switch (type) {
      case EMAIL_TYPES.WELCOME:
        return this.renderer.render(WelcomeEmail, props);

      case EMAIL_TYPES.PROCESSING_COMPLETE:
        return this.renderer.render(ProcessingCompleteEmail, props);

      // Add more template cases as they're implemented
      default:
        // For templates not yet implemented, return a basic HTML template
        return this.createBasicTemplate(emailData);
    }
  }

  private createBasicTemplate(emailData: EmailData): string {
    return `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>${emailData.subject}</h1>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${emailData.html || emailData.text || 'Email content not available'}
        </div>
        <p>
          Best regards,<br />
          The Repurpose AI Team
        </p>
      </div>
    `;
  }

  private async logEmail(logData: {
    userId?: string;
    email: string;
    type: EmailType;
    status: 'sent' | 'failed' | 'delivered' | 'bounced';
    subject: string;
    messageId?: string;
    error?: string;
  }): Promise<void> {
    try {
      await this.prisma.emailLog.create({
        data: {
          userId: logData.userId,
          email: logData.email,
          type: logData.type,
          status: logData.status,
          subject: logData.subject,
          error: logData.error,
          metadata: {
            messageId: logData.messageId,
          },
        },
      });
    } catch (error) {
      console.error('Failed to log email:', error);
      // Don't throw here as this shouldn't break the email sending
    }
  }

  // Utility methods for common email types
  async sendWelcomeEmail(
    to: string,
    userName: string,
    loginUrl: string,
    userId?: string
  ): Promise<string> {
    return this.sendEmail({
      type: EMAIL_TYPES.WELCOME,
      to,
      subject: `Welcome to Repurpose AI, ${userName}!`,
      userName,
      loginUrl,
    }, { userId });
  }

  async sendProcessingCompleteEmail(
    to: string,
    userName: string,
    videoTitle: string,
    clipsCount: number,
    downloadLinks: Array<{
      aspectRatio: string;
      url: string;
    }>,
    dashboardUrl: string,
    userId?: string
  ): Promise<string> {
    return this.sendEmail({
      type: EMAIL_TYPES.PROCESSING_COMPLETE,
      to,
      subject: `Your video "${videoTitle}" is ready!`,
      userName,
      videoTitle,
      clipsCount,
      downloadLinks,
      dashboardUrl,
    }, { userId });
  }

  // Preview method for development
  async previewEmail(emailData: EmailData): Promise<string> {
    return this.renderTemplate(emailData);
  }
}

// Factory function to create email service
export function createEmailService(prisma: PrismaClient, baseUrl?: string): EmailService {
  return new EmailService({ prisma, baseUrl });
}

import { EmailLog } from '@prisma/client';
import { QueuedEmail, EmailTemplateData, EmailType, EmailStatus } from './types';

export interface QueueStats {
  queued: number;
  processing: number;
  failed: number;
  sent: number;
}

export class EmailQueue {
  private queue: QueuedEmail[] = [];
  private processing = false;
  private rateLimitDelay = 1000; // 1 second between emails

  async add(email: QueuedEmail): Promise<void> {
    this.queue.push(email);
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Higher priority first

    if (!this.processing) {
      this.process();
    }
  }

  async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const email = this.queue.shift();
      if (email) {
        try {
          await this.sendEmail(email);
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
        } catch (error) {
          console.error('Failed to send email:', error);
          // Could implement retry logic here
        }
      }
    }

    this.processing = false;
  }

  private async sendEmail(email: QueuedEmail): Promise<void> {
    // This would integrate with the EmailService
    // For now, just log the email
    console.log(`Sending email: ${email.type} to ${email.email}`);
  }

  async retry(failedEmail: EmailLog): Promise<void> {
    // Implement retry logic for failed emails
    console.log(`Retrying email: ${failedEmail.id}`);
  }

  async getQueueStats(): Promise<QueueStats> {
    // This would query the database for actual stats
    return {
      queued: this.queue.length,
      processing: this.processing ? 1 : 0,
      failed: 0,
      sent: 0,
    };
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
  }

  async getQueueLength(): Promise<number> {
    return this.queue.length;
  }
}

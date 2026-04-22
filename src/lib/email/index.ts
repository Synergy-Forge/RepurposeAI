import { User } from "@prisma/client";
import { render } from "@react-email/render";
import React from "react";
import { ZeptoMailProvider, EmailOptions } from "./providers/zeptomail";
import { EmailType, EmailTemplateData } from "./types";
import { getEmailConfig } from "./config";
import { enqueueEmail, EmailJob } from "@/lib/queues/emailQueue";
import { prisma } from "@/lib/prisma";
import { WelcomeEmail } from "./templates/auth/WelcomeEmail";
import { PasswordResetEmail } from "./templates/auth/PasswordResetEmail";
import { ProcessingCompleteEmail } from "./templates/processing/ProcessingCompleteEmail";
import { ProcessingFailedEmail } from "./templates/processing/ProcessingFailedEmail";
import { SubscriptionActivatedEmail } from "./templates/subscription/SubscriptionActivatedEmail";
import { SubscriptionCancelledEmail } from "./templates/subscription/SubscriptionCancelledEmail";
import { SubscriptionDowngradedEmail } from "./templates/subscription/SubscriptionDowngradedEmail";
import { PaymentFailedEmail } from "./templates/billing/PaymentFailedEmail";

export class EmailService {
  private provider: ZeptoMailProvider;

  constructor() {
    this.provider = new ZeptoMailProvider();
  }

  async sendEmail(
    type: EmailType,
    userId: string,
    data: EmailTemplateData
  ): Promise<boolean> {
    try {
      const job = await this.buildEmailJob(type, userId, data);
      await enqueueEmail(job);
      console.log(`Queued email job ${job.type} for ${job.options.to}`);
      return true;
    } catch (error) {
      console.error("Error queuing email:", error);
      return false;
    }
  }

  async deliverQueuedEmail(job: EmailJob): Promise<boolean> {
    try {
      const result = await this.provider.send(job.options);

      if (!result.success) {
        console.error(
          `Failed to send ${job.type} email to ${job.options.to}`,
          result.error
        );
        return false;
      }

      console.log(`Email sent successfully: ${job.type} to ${job.options.to}`);
      return true;
    } catch (error) {
      console.error(
        `Error delivering ${job.type} email to ${job.options.to}:`,
        error
      );
      return false;
    }
  }

  async sendWelcomeEmail(user: User): Promise<boolean> {
    const data: EmailTemplateData = {
      user: {
        name: user.name || "User",
        email: user.email!,
        plan:
          (user.subscriptionStatus as
            | "Free"
            | "Starter"
            | "Creator"
            | "Producer") || "Free",
      },
      unsubscribeUrl: `${getEmailConfig().webappUrl}/unsubscribe`,
      supportUrl: `mailto:${getEmailConfig().supportEmail}`,
    };

    return this.sendEmail(EmailType.WELCOME, user.id, data);
  }

  async sendProcessingEmail(
    type: "started" | "complete" | "failed",
    userId: string,
    videoData: {
      title: string;
      duration: number;
      clipsGenerated: number;
      downloadUrl: string;
    }
  ): Promise<boolean> {
    const emailType =
      type === "started"
        ? EmailType.PROCESSING_STARTED
        : type === "complete"
          ? EmailType.PROCESSING_COMPLETE
          : EmailType.PROCESSING_FAILED;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, subscriptionStatus: true },
    });

    if (!user?.email) return false;

    const data: EmailTemplateData = {
      user: {
        name: user.name ?? "User",
        email: user.email,
        plan:
          (user.subscriptionStatus as
            | "Free"
            | "Starter"
            | "Creator"
            | "Producer") ?? "Free",
      },
      video: videoData,
      unsubscribeUrl: `${getEmailConfig().webappUrl}/unsubscribe`,
      supportUrl: `mailto:${getEmailConfig().supportEmail}`,
    };

    return this.sendEmail(emailType, userId, data);
  }

  async sendSubscriptionEmail(
    type: "activated" | "upgraded" | "downgraded" | "cancelled",
    userId: string,
    subscriptionData: {
      planName: string;
      amount: number;
      nextBillingDate: string;
      gracePeriodEnd?: string;
    }
  ): Promise<boolean> {
    const emailTypeMap = {
      activated: EmailType.SUBSCRIPTION_ACTIVATED,
      upgraded: EmailType.SUBSCRIPTION_UPGRADED,
      downgraded: EmailType.SUBSCRIPTION_DOWNGRADED,
      cancelled: EmailType.SUBSCRIPTION_CANCELLED,
    };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, subscriptionStatus: true },
    });

    if (!user?.email) return false;

    const planMap: Record<string, EmailTemplateData["user"]["plan"]> = {
      starter: "Starter",
      creator: "Creator",
      producer: "Producer",
    };

    const data: EmailTemplateData = {
      user: {
        name: user.name ?? "there",
        email: user.email,
        plan: planMap[user.subscriptionStatus] ?? "Free",
      },
      subscription: subscriptionData,
      unsubscribeUrl: `${getEmailConfig().webappUrl}/unsubscribe`,
      supportUrl: `mailto:${getEmailConfig().supportEmail}`,
    };

    return this.sendEmail(emailTypeMap[type], userId, data);
  }

  async sendBulkEmail(
    type: EmailType,
    users: User[],
    data: EmailTemplateData
  ): Promise<boolean> {
    try {
      const results = await Promise.all(
        users.map((user) => this.sendEmail(type, user.id, data))
      );
      const successCount = results.filter(Boolean).length;
      console.log(
        `Bulk email queued: ${successCount}/${users.length} jobs created`
      );
      return successCount > 0;
    } catch (error) {
      console.error("Error queuing bulk email:", error);
      return false;
    }
  }

  private async buildEmailJob(
    type: EmailType,
    userId: string,
    data: EmailTemplateData
  ): Promise<EmailJob> {
    const emailContent = await this.generateEmailContent(type, data);

    const emailOptions: EmailOptions = {
      to: data.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      from: `${getEmailConfig().fromName} <${getEmailConfig().fromEmail}>`,
    };

    return {
      userId,
      type,
      options: emailOptions,
    };
  }

  private async generateEmailContent(
    type: EmailType,
    data: EmailTemplateData
  ): Promise<{ subject: string; html: string }> {
    const subject = this.getSubjectForType(type);

    let html: string;
    switch (type) {
      case EmailType.WELCOME:
        html = await render(React.createElement(WelcomeEmail, { data }));
        break;
      case EmailType.PROCESSING_COMPLETE:
        html = await render(React.createElement(ProcessingCompleteEmail, { data }));
        break;
      case EmailType.PROCESSING_FAILED:
        html = await render(React.createElement(ProcessingFailedEmail, { data }));
        break;
      case EmailType.SUBSCRIPTION_ACTIVATED:
      case EmailType.SUBSCRIPTION_UPGRADED:
        html = await render(React.createElement(SubscriptionActivatedEmail, { data }));
        break;
      case EmailType.SUBSCRIPTION_DOWNGRADED:
        html = await render(React.createElement(SubscriptionDowngradedEmail, { data }));
        break;
      case EmailType.SUBSCRIPTION_CANCELLED:
        html = await render(React.createElement(SubscriptionCancelledEmail, { data }));
        break;
      case EmailType.PAYMENT_FAILED:
        html = await render(React.createElement(PaymentFailedEmail, { data }));
        break;
      case EmailType.PASSWORD_RESET:
        html = await render(React.createElement(PasswordResetEmail, { data }));
        break;
      default:
        html = this.getHtmlForType(type, data);
    }

    return { subject, html };
  }

  private getSubjectForType(type: EmailType): string {
    const subjects = {
      [EmailType.WELCOME]: "Welcome to Repurpose AI!",
      [EmailType.PROCESSING_STARTED]: "Your video processing has started",
      [EmailType.PROCESSING_COMPLETE]: "Your video clips are ready!",
      [EmailType.PROCESSING_FAILED]: "Video processing failed",
      [EmailType.SUBSCRIPTION_ACTIVATED]: "Welcome to your new plan!",
      [EmailType.SUBSCRIPTION_UPGRADED]: "Plan upgraded successfully!",
      [EmailType.SUBSCRIPTION_DOWNGRADED]: "Plan changed successfully",
      [EmailType.SUBSCRIPTION_CANCELLED]: "Subscription cancelled",
      [EmailType.PAYMENT_SUCCESSFUL]: "Payment successful",
      [EmailType.PAYMENT_FAILED]: "Payment failed",
      [EmailType.QUOTA_WARNING]: "Approaching processing limit",
      [EmailType.QUOTA_EXCEEDED]: "Processing limit reached",
      [EmailType.WEEKLY_DIGEST]: "Your weekly Repurpose AI summary",
      [EmailType.FEATURE_ANNOUNCEMENT]: "New features available!",
      [EmailType.REACTIVATION]: "We miss you at Repurpose AI!",
      [EmailType.LOGIN_ALERT]: "New login detected",
      [EmailType.DOWNGRADE_TO_FREE]: "Subscription ended",
      [EmailType.PASSWORD_RESET]: "Reset your RepurposeAI password",
    };

    return subjects[type] || "Repurpose AI Notification";
  }

  private getHtmlForType(type: EmailType, data: EmailTemplateData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Repurpose AI</h2>
        <p>Hello ${data.user.name},</p>
        <p>${this.getMessageForType(type)}</p>
        <p>Best regards,<br>Repurpose AI Team</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          <a href="${data.unsubscribeUrl}">Unsubscribe</a> |
          <a href="${data.supportUrl}">Support</a>
        </p>
      </div>
    `;
  }

  private getMessageForType(type: EmailType): string {
    const messages = {
      [EmailType.WELCOME]:
        "Welcome to Repurpose AI! Start creating amazing video clips today.",
      [EmailType.PROCESSING_STARTED]:
        "We've started processing your video. You'll receive an email when it's ready.",
      [EmailType.PROCESSING_COMPLETE]:
        "Your video has been processed successfully! Download your clips now.",
      [EmailType.PROCESSING_FAILED]:
        "We encountered an error processing your video. Please try again or contact support.",
      [EmailType.SUBSCRIPTION_ACTIVATED]:
        "Your subscription has been activated! Enjoy your new features.",
      [EmailType.SUBSCRIPTION_UPGRADED]:
        "Your plan has been upgraded successfully!",
      [EmailType.SUBSCRIPTION_DOWNGRADED]:
        "Your plan has been changed successfully.",
      [EmailType.SUBSCRIPTION_CANCELLED]:
        "Your subscription has been cancelled.",
      [EmailType.PAYMENT_SUCCESSFUL]:
        "Your payment has been processed successfully.",
      [EmailType.PAYMENT_FAILED]:
        "Your payment could not be processed. Please update your payment method.",
      [EmailType.QUOTA_WARNING]:
        "You're approaching your monthly processing limit.",
      [EmailType.QUOTA_EXCEEDED]:
        "You've reached your monthly processing limit. Upgrade to continue.",
      [EmailType.WEEKLY_DIGEST]:
        "Here's your weekly summary of video processing activity.",
      [EmailType.FEATURE_ANNOUNCEMENT]: "Check out our new features!",
      [EmailType.REACTIVATION]: "We'd love to see you back at Repurpose AI.",
      [EmailType.LOGIN_ALERT]: "A new login was detected on your account.",
      [EmailType.DOWNGRADE_TO_FREE]:
        "Your subscription has ended and you've been moved to the Free plan.",
      [EmailType.PASSWORD_RESET]:
        "Click the link in this email to reset your password. The link expires in 1 hour.",
    };

    return messages[type] || "You have a new notification from Repurpose AI.";
  }
}

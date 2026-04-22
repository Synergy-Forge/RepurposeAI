#!/usr/bin/env node
import "dotenv/config";
import { EmailService } from "../src/lib/email";
import { EmailType, type EmailTemplateData } from "../src/lib/email/types";

// Rendering fixture values. No SMTP, no DB, no Redis — we only exercise the
// switch inside EmailService.generateEmailContent so that a cross-wired case
// (e.g. the Item #1 bug where cancellation rendered the activation template)
// shows up as a missing phrase.

const baseUrls = {
  unsubscribeUrl: "https://example.com/unsubscribe",
  supportUrl: "support@example.com",
};

const subscriptionData: EmailTemplateData = {
  user: { name: "Test User", email: "test@example.com", plan: "Creator" },
  subscription: {
    planName: "Creator",
    amount: 19,
    nextBillingDate: "2026-05-22",
    gracePeriodEnd: "2026-05-22",
  },
  ...baseUrls,
};

const resetData: EmailTemplateData = {
  user: { name: "Test User", email: "test@example.com", plan: "Free" },
  resetUrl: "https://example.com/reset-password?token=abc123",
  ...baseUrls,
};

const verifyData: EmailTemplateData = {
  user: { name: "Test User", email: "test@example.com", plan: "Free" },
  verificationUrl: "https://example.com/verify-email?token=xyz789",
  ...baseUrls,
};

type Assertion = {
  name: string;
  type: EmailType;
  data: EmailTemplateData;
  mustContain: string[];
  mustNotContain?: string[];
};

const assertions: Assertion[] = [
  {
    name: "SUBSCRIPTION_ACTIVATED",
    type: EmailType.SUBSCRIPTION_ACTIVATED,
    data: subscriptionData,
    mustContain: ["Welcome to", "Creator"],
  },
  {
    name: "SUBSCRIPTION_UPGRADED",
    type: EmailType.SUBSCRIPTION_UPGRADED,
    data: subscriptionData,
    mustContain: ["Welcome to", "Creator"],
  },
  {
    name: "SUBSCRIPTION_DOWNGRADED",
    type: EmailType.SUBSCRIPTION_DOWNGRADED,
    data: subscriptionData,
    mustContain: ["plan has changed", "Creator"],
    // The prior bug routed this to the activation template — make sure the
    // new template isn't reusing that exact headline.
    mustNotContain: ["Welcome to Creator"],
  },
  {
    name: "SUBSCRIPTION_CANCELLED",
    type: EmailType.SUBSCRIPTION_CANCELLED,
    data: subscriptionData,
    mustContain: ["cancelled", "Reactivate"],
    mustNotContain: ["Welcome to Creator"],
  },
  {
    name: "PASSWORD_RESET",
    type: EmailType.PASSWORD_RESET,
    data: resetData,
    mustContain: ["Reset your password", "abc123"],
  },
  {
    name: "EMAIL_VERIFICATION",
    type: EmailType.EMAIL_VERIFICATION,
    data: verifyData,
    mustContain: ["Verify", "xyz789"],
  },
];

interface EmailServiceInternal {
  generateEmailContent: (
    type: EmailType,
    data: EmailTemplateData,
  ) => Promise<{ subject: string; html: string }>;
}

async function main() {
  const service = new EmailService() as unknown as EmailServiceInternal;

  let failures = 0;
  for (const a of assertions) {
    try {
      const { html, subject } = await service.generateEmailContent(a.type, a.data);

      for (const phrase of a.mustContain) {
        if (!html.includes(phrase)) {
          throw new Error(`missing required phrase "${phrase}"`);
        }
      }
      if (a.mustNotContain) {
        for (const phrase of a.mustNotContain) {
          if (html.includes(phrase)) {
            throw new Error(`unexpected phrase present "${phrase}"`);
          }
        }
      }

      console.log(`✅ ${a.name} — "${subject}"`);
    } catch (err) {
      failures += 1;
      console.error(
        `❌ ${a.name}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (failures > 0) {
    console.error(`\n❌ Email template smoke failed (${failures}/${assertions.length})`);
    process.exit(1);
  }

  console.log(`\n🎉 Email template smoke passed (${assertions.length}/${assertions.length})`);
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});

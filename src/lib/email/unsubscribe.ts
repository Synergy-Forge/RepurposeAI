import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getEmailConfig } from "./config";

/**
 * Ensures the given user has an EmailPreference row with an unsubscribe token,
 * creating one with default preferences if the row does not exist yet. Safe to
 * call on every outbound email — idempotent and keyed on the unique userId.
 * Returns the token string, or null when the user has no email on file.
 */
export async function ensureUnsubscribeToken(userId: string): Promise<string | null> {
  const existing = await prisma.emailPreference.findUnique({
    where: { userId },
    select: { unsubscribeToken: true },
  });

  if (existing?.unsubscribeToken) {
    return existing.unsubscribeToken;
  }

  const token = randomBytes(32).toString("hex");

  const preference = await prisma.emailPreference.upsert({
    where: { userId },
    create: {
      id: userId,
      userId,
      unsubscribeToken: token,
    },
    update: {
      ...(existing?.unsubscribeToken ? {} : { unsubscribeToken: token }),
    },
    select: { unsubscribeToken: true },
  });

  return preference.unsubscribeToken;
}

/**
 * Builds the public unsubscribe URL for a given token, using the configured
 * web app origin.
 */
export function buildUnsubscribeUrl(token: string): string {
  return `${getEmailConfig().webappUrl}/unsubscribe?token=${token}`;
}

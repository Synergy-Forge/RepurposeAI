import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { checkRegisterRateLimit } from '@/lib/rate-limiter';
import { EmailService } from '@/lib/email';
import { EmailType } from '@/lib/email/types';
import { getEmailConfig } from '@/lib/email/config';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const allowed = await checkRegisterRateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    // Fire-and-log the verification email — registration succeeds even if the
    // email send fails, mirroring how requestPasswordReset handles transient
    // email failures.
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

      await prisma.verificationToken.deleteMany({ where: { identifier: email } });
      await prisma.verificationToken.create({
        data: { identifier: email, token, expires },
      });

      const emailService = new EmailService();
      const config = getEmailConfig();
      await emailService.sendEmail(EmailType.EMAIL_VERIFICATION, user.id, {
        user: {
          name: user.name ?? 'there',
          email,
          plan: 'Free',
        },
        verificationUrl: `${config.webappUrl}/verify-email?token=${token}`,
        unsubscribeUrl: `${config.webappUrl}/unsubscribe`,
        supportUrl: `mailto:${config.supportEmail}`,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

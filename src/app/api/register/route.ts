import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const _user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Send confirmation email
    const confirmationUrl = `${process.env.NEXTAUTH_URL}/login?email=${encodeURIComponent(email)}`;

    await sendEmail(
      email,
      'Welcome to RepurposeAI - Confirm Your Account',
      `Welcome ${name}!\n\nThank you for registering with Repurpose AI. Please confirm your account by signing in:\n\n${confirmationUrl}\n\nIf you did not register for this account, please ignore this email.`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to RepurposeAI, ${name}!</h2>
          <p>Thank you for registering. Please confirm your account by clicking the button below:</p>
          <a href="${confirmationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Account</a>
          <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${confirmationUrl}</p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">If you did not register for this account, please ignore this email.</p>
        </div>
      `
    );

    return NextResponse.json({ message: 'User registered successfully. Please check your email for confirmation.' });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

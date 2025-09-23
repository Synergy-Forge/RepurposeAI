import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Environment Variable Validation
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("Missing required environment variable: GOOGLE_CLIENT_ID");
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing required environment variable: GOOGLE_CLIENT_SECRET");
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Missing required environment variable: NEXTAUTH_SECRET");
}

const isDevelopment = process.env.NODE_ENV === 'development';

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug logs in both development and production
  adapter: PrismaAdapter(prisma), // Type assertion removed as it should be properly typed

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified
        }
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        if (!user || !user.password) {
          return null;
        }
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image
        };
      }
    }),
  ],

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user, account }) {
      if (isDevelopment) {
        console.log('[AUTH] SignIn attempt:', {
          email: user.email,
          provider: account?.provider
        });
      }

      // Create user in database if they don't exist (for Google auth)
      try {
        if (account?.provider === 'google' && user.email) {
          console.log('[AUTH] Starting Google OAuth flow for:', user.email);
          
          // First, check if the Google account is already linked to any user
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              }
            }
          });

          if (existingAccount) {
            console.log('[AUTH] Found existing account link for user:', existingAccount.userId);
            return true;
          }

          // Find or create user
          let targetUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (!targetUser) {
            console.log('[AUTH] Creating new user:', user.email);
            targetUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || '',
                image: user.image,
                emailVerified: new Date(),
              }
            });
            console.log('[AUTH] User created successfully:', targetUser.id);
          } else {
            console.log('[AUTH] Using existing user:', targetUser.id);
          }

          // Create the account link
          try {
            const accountData = {
              id: crypto.randomUUID(),
              userId: targetUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
              refresh_token: account.refresh_token ?? null
            };

            console.log('[AUTH] Creating account link with data:', JSON.stringify(accountData, null, 2));

            await prisma.account.create({
              data: accountData
            });

            console.log('[AUTH] Account linked successfully to user:', targetUser.id);
            return true;
          } catch (linkError) {
            console.error('[AUTH] Error linking account:', linkError);
            // Try to provide more specific error information
            if (linkError instanceof Error) {
              console.error('[AUTH] Error details:', linkError.message);
              // Type guard for Prisma errors which have a code property
              if (linkError && typeof linkError === 'object' && 'code' in linkError) {
                const prismaError = linkError as { code: string };
                console.error('[AUTH] Error code:', prismaError.code);
              }
            }
            throw linkError;
          }
        }
        return true;
      } catch (error) {
        console.error('[AUTH] Error in signIn callback:', error);
        console.error('[AUTH] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return false;
      }

      return true;
    },

    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.provider = account?.provider;
      }
      return token;
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl + "/dashboard"
    }
  },

  pages: {
    signIn: '/login',
    error: '/login'
  },

  events: {
    async signIn({ user }) {
      if (isDevelopment && user?.email) {
        console.log('[AUTH] User signed in:', user.email);
      }
    },
    async signOut() {
      if (isDevelopment) {
        console.log('[AUTH] User signed out');
      }
    }
  }
};

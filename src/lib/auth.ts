import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcrypt';

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
          console.log('[AUTH] Checking for existing user:', user.email);
          
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (!existingUser) {
            console.log('[AUTH] Creating new user:', user.email);
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || '',
                image: user.image,
                emailVerified: new Date(),
              }
            });
            console.log('[AUTH] User created successfully');
          } else {
            console.log('[AUTH] Existing user found:', existingUser.id);
          }
        }
        return true;
      } catch (error) {
        console.error('[AUTH] Error in signIn callback:', error);
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

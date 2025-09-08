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
  debug: isDevelopment,
  adapter: PrismaAdapter(prisma),

  providers: [
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile"
        }
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
      return true;
    },

    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/dashboard`;
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

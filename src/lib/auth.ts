import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

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

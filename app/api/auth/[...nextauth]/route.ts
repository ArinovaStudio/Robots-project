import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        if (user.status === "SUSPENDED") {
          throw new Error("Your account has been suspended");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isOnboarded: user.isOnboarded,
        };
      }
    })
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {

      if (user) {
        token.id = user.id;
        token.isOnboarded = user.isOnboarded;
      } else if (token.email) {

        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, isOnboarded: true },
        });
        
        if (dbUser) {
          token.id = dbUser.id;
          token.isOnboarded = dbUser.isOnboarded;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isOnboarded = token.isOnboarded as boolean;
      }
      return session;
    },
  },
};

import { NextRequest, NextResponse } from "next/server";
import { authRateLimiter, getIP } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

async function rateLimitedPOST(req: NextRequest, ctx: any) {
  const ip = getIP(req);
  const rateLimit = authRateLimiter.check(ip);
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
      { status: 429 }
    );
  }

  return handler(req, ctx);
}

export { handler as GET, rateLimitedPOST as POST };
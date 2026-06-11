import "server-only";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import type { Role } from "../generated/prisma/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Let "Continue with Google" attach to an existing email+password
      // account with the same address. Despite the scary flag name this is
      // safe for Google specifically: it only asserts emails it has verified,
      // so the Google user provably owns the inbox. Without this, existing
      // users who try Google get an opaque Configuration error.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).trim().toLowerCase() },
        });

        if (!user) return null;

        // Users created via OAuth won't have a password — check account type
        const account = await prisma.account.findFirst({
          where: { userId: user.id, provider: "credentials" },
        });

        if (!account?.access_token) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          account.access_token // we store hashed password in access_token for credentials provider
        );

        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      // Re-read role from the DB on every call so role changes (promotions AND demotions)
      // take effect immediately instead of waiting for the JWT to expire.
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});

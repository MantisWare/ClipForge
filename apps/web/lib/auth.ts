import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@clipforge/database";
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";

const isDev = process.env.NODE_ENV === "development";

const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;
const hasGoogle =
  googleId !== undefined &&
  googleId !== "" &&
  googleSecret !== undefined &&
  googleSecret !== "";

const resendKey = process.env.AUTH_RESEND_KEY;
const emailFrom = process.env.EMAIL_FROM;
const hasResend =
  resendKey !== undefined &&
  resendKey !== "" &&
  emailFrom !== undefined &&
  emailFrom !== "";

const ensureDefaultWorkspace = async (userId: string) => {
  const existing = await prisma.workspace.findFirst({
    where: { ownerId: userId },
  });
  if (existing !== null) {
    return existing;
  }
  return prisma.workspace.create({
    data: {
      name: "My Workspace",
      ownerId: userId,
      members: {
        create: { userId, role: "owner" },
      },
    },
  });
};

const providers: NextAuthConfig["providers"] = [];

if (hasResend) {
  providers.push(
    Resend({
      apiKey: resendKey,
      from: emailFrom,
    }),
  );
}

if (hasGoogle) {
  providers.push(
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
    }),
  );
}

if (isDev) {
  providers.push(
    Credentials({
      name: "Demo",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email
            : "demo@clipforge.local";

        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            name: "Demo Creator",
          },
        });

        await ensureDefaultWorkspace(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: isDev ? "jwt" : "database" },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/verify-request",
  },
  providers,
  events: {
    createUser: async ({ user }) => {
      if (user.id !== undefined) {
        await ensureDefaultWorkspace(user.id);
      }
    },
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id !== undefined) {
        token.sub = user.id;
      }
      return token;
    },
    session: async ({ session, token, user }) => {
      if (session.user !== undefined) {
        if (isDev && token.sub !== undefined) {
          session.user.id = token.sub;
        } else if (user?.id !== undefined) {
          session.user.id = user.id;
        }
      }
      return session;
    },
  },
  trustHost: true,
});

export const getSessionUserId = async (): Promise<string | null> => {
  const session = await auth();
  return session?.user?.id ?? null;
};

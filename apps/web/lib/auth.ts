import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@clipforge/database";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";
import { ensureDefaultWorkspace } from "@/lib/workspace";

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

/** Re-link JWT user ids after DB reset (dev credentials sign-in). Node runtime only. */
const reconcileDatabaseUserId = async (params: {
  rawId: string | undefined;
  email: string | null | undefined;
  name: string | null | undefined;
}): Promise<string | null> => {
  const { rawId, email, name } = params;

  if (rawId !== undefined && rawId !== "") {
    const existing = await prisma.user.findUnique({ where: { id: rawId } });
    if (existing !== null) {
      return existing.id;
    }
  }

  const trimmedEmail = email?.trim();
  if (isDev && trimmedEmail !== undefined && trimmedEmail !== "") {
    const user = await prisma.user.upsert({
      where: { email: trimmedEmail },
      update: {},
      create: {
        email: trimmedEmail,
        name: name ?? "Demo Creator",
      },
    });
    await ensureDefaultWorkspace(user.id);
    return user.id;
  }

  return null;
};

const providers = [...authConfig.providers];

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
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
  events: {
    createUser: async ({ user }) => {
      if (user.id !== undefined) {
        await ensureDefaultWorkspace(user.id);
      }
    },
  },
});

/**
 * Resolves the database user id for the current session (server / API routes).
 * In dev, re-links stale JWT ids by email after a DB reset.
 */
export const getSessionUserId = async (): Promise<string | null> => {
  const session = await auth();
  if (session?.user === undefined) {
    return null;
  }
  return reconcileDatabaseUserId({
    rawId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });
};

import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@clipforge/database";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;
const hasGoogle =
  googleId !== undefined &&
  googleId !== "" &&
  googleSecret !== undefined &&
  googleSecret !== "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    ...(hasGoogle
      ? [
          Google({
            clientId: googleId,
            clientSecret: googleSecret,
          }),
        ]
      : []),
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

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id !== undefined) {
        token.sub = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.sub !== undefined && session.user !== undefined) {
        session.user.id = token.sub;
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

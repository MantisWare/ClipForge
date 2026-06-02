import type { NextAuthConfig } from "next-auth";

const isDev = process.env.NODE_ENV === "development";

/**
 * Edge-compatible Auth.js config (no Prisma). Used by middleware and merged in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/verify-request",
  },
  session: { strategy: isDev ? "jwt" : "database" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user?.id !== undefined) {
        token.sub = user.id;
      }
      return token;
    },
    session: ({ session, token, user }) => {
      if (session.user !== undefined) {
        if (isDev && token.sub !== undefined && token.sub !== "") {
          session.user.id = token.sub;
        } else if (user?.id !== undefined) {
          session.user.id = user.id;
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

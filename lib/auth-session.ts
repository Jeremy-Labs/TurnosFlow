import type { NextAuthConfig } from "next-auth";

export const authCallbacks = {
  async jwt({ token, user }) {
    if (user?.id) token.userId = user.id;
    return token;
  },
  async session({ session, token }) {
    if (session.user && token.userId) session.user.id = token.userId;
    return session;
  },
} satisfies NonNullable<NextAuthConfig["callbacks"]>;

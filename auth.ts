import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
import { verifyPassword } from "./lib/passwords";
import { authCallbacks } from "./lib/auth-session";

export { authCallbacks } from "./lib/auth-session";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Credentials({
    name: "Credenciales",
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      if (typeof credentials?.email !== "string" || typeof credentials.password !== "string") return null;
      const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase().trim() } });
      if (!user?.passwordHash || !(await verifyPassword(credentials.password, user.passwordHash))) return null;
      return user;
    },
  })],
  session: { strategy: "jwt" },
  callbacks: authCallbacks,
});

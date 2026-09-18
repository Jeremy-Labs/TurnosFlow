import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
export const { handlers, auth, signIn, signOut } = NextAuth({ adapter: PrismaAdapter(prisma), providers: [Credentials({ name: "Credenciales", credentials: { email: {}, password: {} }, async authorize(credentials) { if (!credentials?.email || credentials.password !== "demo") return null; return prisma.user.findUnique({ where: { email: String(credentials.email) } }); } })], session: { strategy: "jwt" } });

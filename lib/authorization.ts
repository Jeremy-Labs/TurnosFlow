import { auth } from "@/auth";
import { prisma } from "./prisma";
export { BusinessRoleRequiredError, getDashboardDestination, requireBusinessRole } from "./business-context";

export class AuthenticationRequiredError extends Error {}
export class BusinessMembershipRequiredError extends Error {}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new AuthenticationRequiredError("Sesión requerida");
  return { id: session.user.id, email: session.user.email };
}

export async function getUserMemberships(userId: string) {
  return prisma.membership.findMany({ where: { userId }, include: { business: true }, orderBy: { business: { name: "asc" } } });
}

export async function requireBusinessMembership(userId: string, businessSlug: string) {
  const membership = await prisma.membership.findFirst({ where: { userId, business: { slug: businessSlug } }, include: { business: true } });
  if (!membership) throw new BusinessMembershipRequiredError("No pertenecés a este negocio");
  return membership;
}

import { MembershipRole } from "@prisma/client";

export class BusinessRoleRequiredError extends Error {}

export function getDashboardDestination(memberships: { business: { slug: string } }[]) {
  if (memberships.length === 0) return null;
  if (memberships.length === 1) return `/dashboard/${memberships[0].business.slug}`;
  return "/dashboard/seleccionar-negocio";
}

export function requireBusinessRole(role: MembershipRole, allowedRoles: MembershipRole[]) {
  if (!allowedRoles.includes(role)) throw new BusinessRoleRequiredError("No tenés permisos suficientes");
}

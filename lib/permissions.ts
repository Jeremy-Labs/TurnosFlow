import { MembershipRole } from "@prisma/client";
export function canManageBusiness(role: MembershipRole) { return role === MembershipRole.OWNER || role === MembershipRole.ADMIN; }
export function canEditAppointment(role: MembershipRole) { return role === MembershipRole.OWNER || role === MembershipRole.ADMIN || role === MembershipRole.STAFF; }
export function assertBusinessScope(resourceBusinessId: string, membershipBusinessId: string) { if (resourceBusinessId !== membershipBusinessId) throw new Error("Recurso fuera del negocio actual"); }

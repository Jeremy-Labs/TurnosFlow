import { AppointmentStatus, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export class PrivateResourceNotFoundError extends Error {}

export async function updateAppointmentStatusForMember(email: string, appointmentId: string, status: AppointmentStatus) {
  const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, business: { memberships: { some: { user: { email } } } } } });
  if (!appointment) throw new PrivateResourceNotFoundError("Turno no encontrado");
  return prisma.appointment.update({ where: { id: appointment.id }, data: { status } });
}

export function appointmentMemberScope(email: string, appointmentId: string): Prisma.AppointmentWhereInput {
  return { id: appointmentId, business: { memberships: { some: { user: { email } } } } };
}

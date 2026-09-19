import { AppointmentStatus, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export class PrivateResourceNotFoundError extends Error {}

export async function updateAppointmentStatusForMember(userId: string, appointmentId: string, status: AppointmentStatus) {
  const appointment = await prisma.appointment.findFirst({ where: appointmentMemberScope(userId, appointmentId) });
  if (!appointment) throw new PrivateResourceNotFoundError("Turno no encontrado");
  return prisma.appointment.update({ where: { id: appointment.id }, data: { status } });
}

export function appointmentMemberScope(userId: string, appointmentId: string): Prisma.AppointmentWhereInput {
  return { id: appointmentId, business: { memberships: { some: { userId } } } };
}

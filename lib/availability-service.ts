import { Prisma, PrismaClient } from "@prisma/client";
import { generateSlots, getBusinessDayBounds } from "./domain/availability";

type DatabaseClient = PrismaClient | Prisma.TransactionClient;
export type PublicAvailabilityInput = { businessSlug: string; serviceId: string; employeeId: string; date: string };

export function assertRequestedSlot(slots: { startAt: Date }[], startAt: Date) {
  if (!slots.some((slot) => slot.startAt.getTime() === startAt.getTime())) throw new Error("Ese horario no está disponible");
}

export async function getPublicAvailability(db: DatabaseClient, input: PublicAvailabilityInput) {
  const business = await db.business.findUnique({ where: { slug: input.businessSlug } });
  if (!business) throw new Error("Negocio no encontrado");
  const [service, employee] = await Promise.all([
    db.service.findFirst({ where: { id: input.serviceId, businessId: business.id, active: true } }),
    db.employee.findFirst({ where: { id: input.employeeId, businessId: business.id, active: true, services: { some: { serviceId: input.serviceId } } }, include: { availability: true } }),
  ]);
  if (!service || !employee) throw new Error("Servicio o profesional no disponible");
  const { startAt, endAt } = getBusinessDayBounds(input.date, business.timezone);
  const appointments = await db.appointment.findMany({ where: { businessId: business.id, employeeId: employee.id, status: { not: "CANCELLED" }, startAt: { lt: endAt }, endAt: { gt: startAt } } });
  return { business, service, employee, slots: generateSlots(input.date, business.timezone, service.durationMinutes, employee.availability, appointments) };
}

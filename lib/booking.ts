import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { assertRequestedSlot, getPublicAvailability } from "./availability-service";
import { businessDateFromInstant } from "./domain/availability";
import { bookingSchema } from "./validation/schemas";

export class BookingConflictError extends Error {}

function isRetryableSerializationError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002", "P2004"].includes(error.code);
}

export async function createPublicBooking(input: unknown) {
  const data = bookingSchema.parse(input);
  if (data.startAt.getTime() <= Date.now()) throw new BookingConflictError("El horario debe ser futuro");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const business = await tx.business.findUnique({ where: { slug: data.businessSlug } });
        if (!business) throw new Error("Negocio no encontrado");
        const date = businessDateFromInstant(data.startAt, business.timezone);
        const availability = await getPublicAvailability(tx, { businessSlug: data.businessSlug, serviceId: data.serviceId, employeeId: data.employeeId, date });
        try { assertRequestedSlot(availability.slots, data.startAt); } catch { throw new BookingConflictError("Ese horario no está disponible"); }
        const customer = await tx.customer.findFirst({ where: { businessId: business.id, OR: [{ phone: data.phone }, ...(data.email ? [{ email: data.email }] : [])] } });
        const savedCustomer = customer ?? await tx.customer.create({ data: { businessId: business.id, name: data.name, phone: data.phone, email: data.email || null, notes: data.notes } });
        if (customer) await tx.customer.update({ where: { id: customer.id }, data: { name: data.name, email: data.email || customer.email, notes: data.notes ?? customer.notes } });
        return tx.appointment.create({ data: { businessId: business.id, customerId: savedCustomer.id, employeeId: availability.employee.id, serviceId: availability.service.id, startAt: data.startAt, endAt: new Date(data.startAt.getTime() + availability.service.durationMinutes * 60000), notes: data.notes, status: "PENDING" }, include: { service: true, employee: true, customer: true } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isRetryableSerializationError(error) && attempt === 0) continue;
      if (isRetryableSerializationError(error)) throw new BookingConflictError("El horario acaba de reservarse. Elegí otro.");
      throw error;
    }
  }
  throw new BookingConflictError("El horario acaba de reservarse. Elegí otro.");
}

import { prisma } from "./prisma";
import { bookingSchema } from "./validation/schemas";
import { overlaps } from "./domain/availability";

export async function createPublicBooking(input: unknown) {
  const data = bookingSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const business = await tx.business.findUnique({ where: { slug: data.businessSlug } });
    if (!business) throw new Error("Negocio no encontrado");
    const service = await tx.service.findFirst({ where: { id: data.serviceId, businessId: business.id, active: true }, include: { employees: true } });
    const employee = await tx.employee.findFirst({ where: { id: data.employeeId, businessId: business.id, active: true, services: { some: { serviceId: data.serviceId } } } });
    if (!service || !employee) throw new Error("Servicio o profesional no disponible");
    const endAt = new Date(data.startAt.getTime() + service.durationMinutes * 60000);
    const conflicts = await tx.appointment.findMany({ where: { businessId: business.id, employeeId: employee.id, status: { not: "CANCELLED" }, startAt: { lt: endAt }, endAt: { gt: data.startAt } } });
    if (conflicts.some((appointment) => overlaps(data.startAt, endAt, appointment.startAt, appointment.endAt))) throw new Error("Ese horario ya no está disponible");
    const customer = await tx.customer.findFirst({ where: { businessId: business.id, OR: [{ phone: data.phone }, ...(data.email ? [{ email: data.email }] : [])] } });
    const savedCustomer = customer ?? await tx.customer.create({ data: { businessId: business.id, name: data.name, phone: data.phone, email: data.email || null, notes: data.notes } });
    if (customer) await tx.customer.update({ where: { id: customer.id }, data: { name: data.name, email: data.email || customer.email, notes: data.notes ?? customer.notes } });
    return tx.appointment.create({ data: { businessId: business.id, customerId: savedCustomer.id, employeeId: employee.id, serviceId: service.id, startAt: data.startAt, endAt, notes: data.notes, status: "PENDING" }, include: { service: true, employee: true, customer: true } });
  }, { isolationLevel: "Serializable" });
}

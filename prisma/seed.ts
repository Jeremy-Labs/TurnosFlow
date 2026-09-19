import { PrismaClient, AppointmentStatus, MembershipRole } from "@prisma/client";
import { hashPassword } from "../lib/passwords";
const prisma = new PrismaClient();

async function main() {
  const demoPasswordHash = await hashPassword("demo");
  const owner = await prisma.user.upsert({ where: { email: "demo@turnosflow.local" }, update: { passwordHash: demoPasswordHash }, create: { name: "Demo Owner", email: "demo@turnosflow.local", passwordHash: demoPasswordHash } });
  const business = await prisma.business.upsert({ where: { slug: "barberia-central" }, update: {}, create: { name: "Barbería Central", slug: "barberia-central", description: "Barbería de barrio con reserva online", phone: "+34 600 123 456", email: "hola@barberia-central.local", timezone: "Europe/Madrid" } });
  await prisma.membership.upsert({ where: { userId_businessId: { userId: owner.id, businessId: business.id } }, update: { role: MembershipRole.OWNER }, create: { userId: owner.id, businessId: business.id, role: MembershipRole.OWNER } });
  const [corte, barba, combo] = await Promise.all([
    prisma.service.upsert({ where: { id: "demo-corte" }, update: {}, create: { id: "demo-corte", businessId: business.id, name: "Corte", durationMinutes: 30, price: 15 } }),
    prisma.service.upsert({ where: { id: "demo-barba" }, update: {}, create: { id: "demo-barba", businessId: business.id, name: "Barba", durationMinutes: 20, price: 10 } }),
    prisma.service.upsert({ where: { id: "demo-combo" }, update: {}, create: { id: "demo-combo", businessId: business.id, name: "Corte + barba", durationMinutes: 45, price: 22 } }),
  ]);
  const juan = await prisma.employee.upsert({ where: { id: "demo-juan" }, update: {}, create: { id: "demo-juan", businessId: business.id, name: "Juan" } });
  const maria = await prisma.employee.upsert({ where: { id: "demo-maria" }, update: {}, create: { id: "demo-maria", businessId: business.id, name: "María" } });
  for (const employee of [juan, maria]) for (const day of [1, 2, 3, 4, 5]) await prisma.availability.upsert({ where: { id: `demo-${employee.id}-${day}` }, update: {}, create: { id: `demo-${employee.id}-${day}`, employeeId: employee.id, dayOfWeek: day, startTime: "09:00", endTime: "18:00" } });
  for (const [employeeId, serviceId] of [[juan.id, corte.id], [juan.id, barba.id], [juan.id, combo.id], [maria.id, corte.id], [maria.id, combo.id]] as const) await prisma.employeeService.upsert({ where: { employeeId_serviceId: { employeeId, serviceId } }, update: {}, create: { employeeId, serviceId } });
  const customer = await prisma.customer.upsert({ where: { id: "demo-customer" }, update: {}, create: { id: "demo-customer", businessId: business.id, name: "Lucía García", phone: "+34 611 222 333", email: "lucia@example.com" } });
  const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(10, 0, 0, 0);
  await prisma.appointment.upsert({ where: { id: "demo-appointment" }, update: {}, create: { id: "demo-appointment", businessId: business.id, customerId: customer.id, employeeId: juan.id, serviceId: corte.id, startAt: start, endAt: new Date(start.getTime() + 30 * 60000), status: AppointmentStatus.CONFIRMED } });
}
main().finally(() => prisma.$disconnect());

import { afterEach, describe, expect, it } from "vitest";
import { MembershipRole } from "@prisma/client";
import { createPublicBooking } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { appointmentMemberScope, PrivateResourceNotFoundError, updateAppointmentStatusForMember } from "@/lib/private-appointments";

const describePostgres = process.env.RUN_POSTGRES_TESTS === "1" ? describe : describe.skip;
const createdBusinessIds: string[] = [];

async function makeBusiness(suffix: string, email: string) {
  const user = await prisma.user.create({ data: { email } });
  const business = await prisma.business.create({ data: { name: `Test ${suffix}`, slug: `test-${suffix}`, timezone: "Europe/Madrid", memberships: { create: { userId: user.id, role: MembershipRole.OWNER } }, services: { create: { name: "Corte", durationMinutes: 30 } } } });
  createdBusinessIds.push(business.id);
  const service = await prisma.service.findFirstOrThrow({ where: { businessId: business.id } });
  const employee = await prisma.employee.create({ data: { businessId: business.id, name: "Profesional", availability: { create: { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" } }, services: { create: { serviceId: service.id } } } });
  return { user, business, service, employee };
}

afterEach(async () => {
  await Promise.all(createdBusinessIds.splice(0).map((id) => prisma.business.delete({ where: { id } })));
});

describePostgres("PostgreSQL booking integrity", () => {
  it("allows exactly one concurrent reservation for the same slot", async () => {
    const suffix = `concurrent-${Date.now()}`;
    const { business, service, employee } = await makeBusiness(suffix, `${suffix}@example.test`);
    const request = { businessSlug: business.slug, serviceId: service.id, employeeId: employee.id, startAt: "2030-01-07T08:00:00.000Z", name: "Cliente", phone: "+34111111111" };
    const results = await Promise.allSettled([createPublicBooking(request), createPublicBooking(request)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    const appointments = await prisma.appointment.findMany({ where: { employeeId: employee.id } });
    expect(appointments).toHaveLength(1);
  });

  it("does not let a member of business A modify a business B appointment", async () => {
    const suffix = `tenant-${Date.now()}`;
    const a = await makeBusiness(`${suffix}-a`, `${suffix}-a@example.test`);
    const b = await makeBusiness(`${suffix}-b`, `${suffix}-b@example.test`);
    const customer = await prisma.customer.create({ data: { businessId: b.business.id, name: "Cliente B", phone: "+34222222222" } });
    const appointment = await prisma.appointment.create({ data: { businessId: b.business.id, customerId: customer.id, employeeId: b.employee.id, serviceId: b.service.id, startAt: new Date("2030-01-07T08:00:00.000Z"), endAt: new Date("2030-01-07T08:30:00.000Z") } });
    expect(await prisma.appointment.findFirst({ where: appointmentMemberScope(a.user.id, appointment.id) })).toBeNull();
    await expect(updateAppointmentStatusForMember(a.user.id, appointment.id, "CANCELLED")).rejects.toBeInstanceOf(PrivateResourceNotFoundError);
    await expect(updateAppointmentStatusForMember(a.user.id, appointment.id, "CONFIRMED")).rejects.toBeInstanceOf(PrivateResourceNotFoundError);
    expect((await prisma.appointment.findUniqueOrThrow({ where: { id: appointment.id } })).status).toBe("PENDING");
  });
});

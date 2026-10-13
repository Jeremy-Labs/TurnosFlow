import { describe, expect, it, vi } from "vitest";
import { AppointmentStatus } from "@prisma/client";
import {
  getBusinessOperationalMetrics,
  getBusinessWeekBounds,
} from "@/lib/admin-metrics";
import { prisma } from "@/lib/prisma";

describe("Operational Metrics and Week Bounds", () => {
  describe("getBusinessWeekBounds", () => {
    it("calculates Monday-Sunday bounds correctly for a mid-week day in Europe/Madrid", () => {
      // 2026-10-14 is Wednesday
      const bounds = getBusinessWeekBounds("2026-10-14", "Europe/Madrid");

      expect(bounds.monday).toBe("2026-10-12");
      expect(bounds.sunday).toBe("2026-10-18");

      // In Europe/Madrid during October (CEST, UTC+2):
      // 2026-10-12 00:00 Madrid is 2026-10-11 22:00 UTC
      expect(bounds.startAt.toISOString()).toBe("2026-10-11T22:00:00.000Z");
      // Next Monday 2026-10-19 00:00 Madrid is 2026-10-18 22:00 UTC
      expect(bounds.endAt.toISOString()).toBe("2026-10-18T22:00:00.000Z");
    });

    it("calculates Monday-Sunday bounds correctly when given a Sunday in America/Argentina/Buenos_Aires", () => {
      // 2026-10-18 is Sunday (should belong to the week starting Monday 2026-10-12)
      const bounds = getBusinessWeekBounds(
        "2026-10-18",
        "America/Argentina/Buenos_Aires"
      );

      expect(bounds.monday).toBe("2026-10-12");
      expect(bounds.sunday).toBe("2026-10-18");

      // America/Argentina/Buenos_Aires is UTC-3 all year:
      // 2026-10-12 00:00 ART is 2026-10-12 03:00 UTC
      expect(bounds.startAt.toISOString()).toBe("2026-10-12T03:00:00.000Z");
      // Next Monday 2026-10-19 00:00 ART is 2026-10-19 03:00 UTC
      expect(bounds.endAt.toISOString()).toBe("2026-10-19T03:00:00.000Z");
    });

    it("calculates bounds correctly when date is already a Monday", () => {
      const bounds = getBusinessWeekBounds("2026-10-12", "Europe/Madrid");

      expect(bounds.monday).toBe("2026-10-12");
      expect(bounds.sunday).toBe("2026-10-18");
      expect(bounds.startAt.toISOString()).toBe("2026-10-11T22:00:00.000Z");
      expect(bounds.endAt.toISOString()).toBe("2026-10-18T22:00:00.000Z");
    });

    it("handles year transition correctly", () => {
      // 2026-01-01 is Thursday -> Monday is 2025-12-29 and Sunday is 2026-01-04
      const bounds = getBusinessWeekBounds("2026-01-01", "UTC");

      expect(bounds.monday).toBe("2025-12-29");
      expect(bounds.sunday).toBe("2026-01-04");
      expect(bounds.startAt.toISOString()).toBe("2025-12-29T00:00:00.000Z");
      expect(bounds.endAt.toISOString()).toBe("2026-01-05T00:00:00.000Z");
    });

    it("throws error on invalid date or invalid timezone", () => {
      expect(() => getBusinessWeekBounds("invalid-date", "UTC")).toThrow();
      expect(() => getBusinessWeekBounds("2026-10-14", "Invalid/Zone")).toThrow();
    });
  });

  describe("getBusinessOperationalMetrics and multi-tenant isolation", () => {
    it("strictly isolates all metrics and queries by businessId", async () => {
      const appointmentCountSpy = vi
        .spyOn(prisma.appointment, "count")
        .mockResolvedValue(5);
      const customerCountSpy = vi
        .spyOn(prisma.customer, "count")
        .mockResolvedValue(12);
      const serviceCountSpy = vi
        .spyOn(prisma.service, "count")
        .mockResolvedValue(4);
      const employeeCountSpy = vi
        .spyOn(prisma.employee, "count")
        .mockResolvedValue(2);
      const upcomingSpy = vi
        .spyOn(prisma.appointment, "findMany")
        .mockResolvedValue([
          {
            id: "apt-1",
            startAt: new Date("2026-10-14T10:00:00Z"),
            endAt: new Date("2026-10-14T10:30:00Z"),
            status: AppointmentStatus.CONFIRMED,
            customer: { id: "c1", name: "Lucía", phone: "+34 611", email: null },
            service: { id: "s1", name: "Corte", durationMinutes: 30 },
            employee: { id: "e1", name: "Juan" },
          },
        ] as any);

      const targetBiz = "biz-target-123";
      const result = await getBusinessOperationalMetrics(
        targetBiz,
        "Europe/Madrid",
        "2026-10-14"
      );

      // Verify returned metrics aggregate correctly
      expect(result.todayAppointmentsCount).toBe(5);
      expect(result.weekAppointmentsCount).toBe(5);
      expect(result.confirmedCount).toBe(5);
      expect(result.completedCount).toBe(5);
      expect(result.cancelledCount).toBe(5);
      expect(result.noShowCount).toBe(5);
      expect(result.totalCustomersCount).toBe(12);
      expect(result.serviceCount).toBe(4);
      expect(result.employeeCount).toBe(2);
      expect(result.upcomingAppointments).toHaveLength(1);
      expect(result.upcomingAppointments[0].customer.name).toBe("Lucía");

      // Verify every appointment.count query included businessId: targetBiz
      for (const call of appointmentCountSpy.mock.calls) {
        expect(call[0]?.where).toMatchObject({
          businessId: targetBiz,
        });
      }

      // Verify customer.count query was scoped to targetBiz
      expect(customerCountSpy).toHaveBeenCalledWith({
        where: { businessId: targetBiz },
      });

      // Verify service.count was scoped to targetBiz
      expect(serviceCountSpy).toHaveBeenCalledWith({
        where: { businessId: targetBiz, active: true },
      });

      // Verify employee.count was scoped to targetBiz
      expect(employeeCountSpy).toHaveBeenCalledWith({
        where: { businessId: targetBiz, active: true },
      });

      // Verify upcoming appointments findMany was scoped to targetBiz
      expect(upcomingSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId: targetBiz,
          }),
        })
      );
    });
  });
});

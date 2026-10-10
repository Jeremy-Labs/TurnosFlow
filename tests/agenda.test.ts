import { describe, expect, it } from "vitest";
import { AppointmentStatus } from "@prisma/client";
import {
  buildAgendaWhereClause,
  getBusinessToday,
  sanitizeAgendaFilters,
} from "@/lib/admin-appointments";
import { getBusinessDayBounds } from "@/lib/domain/availability";

describe("admin agenda domain and filters", () => {
  it("defaults to the business local calendar date when no date is provided", () => {
    const timezone = "Europe/Madrid";
    const today = getBusinessToday(timezone);
    const sanitized = sanitizeAgendaFilters({}, timezone);

    expect(sanitized.date).toBe(today);
    expect(sanitized.employeeId).toBeUndefined();
    expect(sanitized.serviceId).toBeUndefined();
    expect(sanitized.status).toBeUndefined();
  });

  it("falls back to business today when an invalid date is provided", () => {
    const timezone = "Europe/Madrid";
    const today = getBusinessToday(timezone);
    const sanitized = sanitizeAgendaFilters({ date: "invalid-date" }, timezone);

    expect(sanitized.date).toBe(today);
  });

  it("accepts a valid YYYY-MM-DD date and filters", () => {
    const timezone = "Europe/Madrid";
    const sanitized = sanitizeAgendaFilters(
      {
        date: "2030-01-07",
        employeeId: "emp-1",
        serviceId: "svc-1",
        status: "CONFIRMED",
      },
      timezone
    );

    expect(sanitized.date).toBe("2030-01-07");
    expect(sanitized.employeeId).toBe("emp-1");
    expect(sanitized.serviceId).toBe("svc-1");
    expect(sanitized.status).toBe(AppointmentStatus.CONFIRMED);
  });

  it("ignores 'ALL' or empty values for employeeId, serviceId and status", () => {
    const timezone = "Europe/Madrid";
    const sanitized = sanitizeAgendaFilters(
      {
        date: "2030-01-07",
        employeeId: "ALL",
        serviceId: "   ",
        status: "ALL",
      },
      timezone
    );

    expect(sanitized.date).toBe("2030-01-07");
    expect(sanitized.employeeId).toBeUndefined();
    expect(sanitized.serviceId).toBeUndefined();
    expect(sanitized.status).toBeUndefined();
  });

  it("ignores unknown or corrupted status values", () => {
    const timezone = "Europe/Madrid";
    const sanitized = sanitizeAgendaFilters(
      {
        date: "2030-01-07",
        status: "INVENTED_STATUS",
      },
      timezone
    );

    expect(sanitized.status).toBeUndefined();
  });

  it("builds Prisma where clause strictly bounded to businessId and local day UTC boundaries", () => {
    const timezone = "America/Argentina/Buenos_Aires";
    const date = "2026-06-15";
    const bounds = getBusinessDayBounds(date, timezone);

    const where = buildAgendaWhereClause(
      "biz-123",
      {
        date,
        employeeId: "emp-123",
        serviceId: "svc-123",
        status: AppointmentStatus.CONFIRMED,
      },
      timezone
    );

    // Multitenancy assertion: businessId must strictly match biz-123
    expect(where.businessId).toBe("biz-123");
    expect(where.employeeId).toBe("emp-123");
    expect(where.serviceId).toBe("svc-123");
    expect(where.status).toBe(AppointmentStatus.CONFIRMED);

    // Time boundaries must match start of day to start of next day in local timezone
    expect(where.startAt).toEqual({
      gte: bounds.startAt,
      lt: bounds.endAt,
    });
    // In Buenos Aires (UTC-3), 2026-06-15 00:00 is 2026-06-15 03:00 UTC
    expect((where.startAt as { gte: Date }).gte.toISOString()).toBe("2026-06-15T03:00:00.000Z");
    expect((where.startAt as { lt: Date }).lt.toISOString()).toBe("2026-06-16T03:00:00.000Z");
  });

  it("does not allow external filters to compromise or override business isolation", () => {
    const timezone = "Europe/Madrid";
    const maliciousInput = {
      date: "2026-01-01",
      employeeId: "emp-victim",
    };

    const where = buildAgendaWhereClause("tenant-allowed", maliciousInput, timezone);
    expect(where.businessId).toBe("tenant-allowed");
    expect(where.employeeId).toBe("emp-victim");
  });
});

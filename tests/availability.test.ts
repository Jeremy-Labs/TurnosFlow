import { describe, expect, it } from "vitest";
import { businessDateFromInstant, generateSlots, getBusinessDayBounds, overlaps, toUtcFromBusinessTime } from "@/lib/domain/availability";
import { assertRequestedSlot } from "@/lib/availability-service";

describe("availability engine", () => {
  it("generates local-business slots and removes overlapping appointments", () => {
    const slots = generateSlots("2026-09-21", "Europe/Madrid", 30, [{ dayOfWeek: 1, startTime: "09:00", endTime: "13:00" }], [{ startAt: new Date("2026-09-21T08:00:00Z"), endAt: new Date("2026-09-21T08:30:00Z"), status: "CONFIRMED" }]);
    expect(slots.map((slot) => slot.startAt.toISOString())).not.toContain("2026-09-21T08:00:00.000Z");
    expect(slots).toHaveLength(7);
  });

  it("uses half-open intervals for boundary appointments", () => {
    expect(overlaps(new Date("2026-01-01T10:30Z"), new Date("2026-01-01T11:00Z"), new Date("2026-01-01T10:00Z"), new Date("2026-01-01T10:30Z"))).toBe(false);
  });

  it("converts Madrid and Buenos Aires wall times to UTC", () => {
    expect(toUtcFromBusinessTime("2026-01-21", "09:00", "Europe/Madrid").toISOString()).toBe("2026-01-21T08:00:00.000Z");
    expect(toUtcFromBusinessTime("2026-01-21", "09:00", "America/Argentina/Buenos_Aires").toISOString()).toBe("2026-01-21T12:00:00.000Z");
  });

  it("uses local calendar-day bounds rather than a fixed UTC day", () => {
    const buenosAires = getBusinessDayBounds("2026-01-21", "America/Argentina/Buenos_Aires");
    expect(buenosAires.startAt.toISOString()).toBe("2026-01-21T03:00:00.000Z");
    expect(buenosAires.endAt.toISOString()).toBe("2026-01-22T03:00:00.000Z");
  });

  it("handles Madrid DST start and end days", () => {
    const spring = getBusinessDayBounds("2026-03-29", "Europe/Madrid");
    const autumn = getBusinessDayBounds("2026-10-25", "Europe/Madrid");
    expect(spring.endAt.getTime() - spring.startAt.getTime()).toBe(23 * 60 * 60 * 1000);
    expect(autumn.endAt.getTime() - autumn.startAt.getTime()).toBe(25 * 60 * 60 * 1000);
  });

  it("derives the correct business date from a UTC instant", () => {
    expect(businessDateFromInstant(new Date("2026-01-21T01:00:00Z"), "America/Argentina/Buenos_Aires")).toBe("2026-01-20");
  });

  it("rejects arbitrary instants that do not equal a generated slot", () => {
    const slots = generateSlots("2030-01-07", "Europe/Madrid", 30, [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }], []);
    expect(() => assertRequestedSlot(slots, toUtcFromBusinessTime("2030-01-07", "09:15", "Europe/Madrid"))).toThrow("no está disponible");
  });
});

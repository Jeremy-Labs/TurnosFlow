import { describe, expect, it } from "vitest";
import { generateSlots, overlaps, toUtcFromBusinessTime } from "@/lib/domain/availability";
describe("availability engine", () => {
  it("generates slots and removes overlapping appointments", () => {
    const day = new Date("2026-09-21T00:00:00Z");
    const slots = generateSlots(day, "Europe/Madrid", 30, [{ dayOfWeek: 1, startTime: "09:00", endTime: "13:00" }], [{ startAt: new Date("2026-09-21T10:00:00Z"), endAt: new Date("2026-09-21T10:30:00Z"), status: "CONFIRMED" }]);
    expect(slots.map((x) => x.startAt.toISOString())).not.toContain("2026-09-21T10:00:00.000Z");
    expect(slots).toHaveLength(7);
  });
  it("uses half-open intervals for boundary appointments", () => { expect(overlaps(new Date("2026-01-01T10:30Z"), new Date("2026-01-01T11:00Z"), new Date("2026-01-01T10:00Z"), new Date("2026-01-01T10:30Z"))).toBe(false); });
  it("converts business local time to UTC", () => { expect(toUtcFromBusinessTime("2026-01-21", "09:00", "Europe/Madrid").toISOString()).toBe("2026-01-21T08:00:00.000Z"); });
});

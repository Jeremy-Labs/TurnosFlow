export type TimeBlock = { dayOfWeek: number; startTime: string; endTime: string };
export type ExistingAppointment = { startAt: Date; endAt: Date; status: string };
export type Slot = { startAt: Date; endAt: Date };

export function overlaps(startAt: Date, endAt: Date, otherStart: Date, otherEnd: Date) {
  return startAt < otherEnd && endAt > otherStart;
}

export function generateSlots(date: Date, timezone: string, durationMinutes: number, blocks: TimeBlock[], appointments: ExistingAppointment[], stepMinutes = durationMinutes): Slot[] {
  const day = date.getUTCDay();
  const result: Slot[] = [];
  for (const block of blocks.filter((item) => item.dayOfWeek === day)) {
    const [startHour, startMinute] = block.startTime.split(":").map(Number);
    const [endHour, endMinute] = block.endTime.split(":").map(Number);
    const dayText = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    const cursor = toUtcFromBusinessTime(dayText, `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`, timezone);
    const end = toUtcFromBusinessTime(dayText, `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`, timezone);
    while (cursor.getTime() + durationMinutes * 60000 <= end.getTime()) {
      const slotStart = new Date(cursor); const slotEnd = new Date(cursor.getTime() + durationMinutes * 60000);
      const busy = appointments.some((appointment) => appointment.status !== "CANCELLED" && overlaps(slotStart, slotEnd, appointment.startAt, appointment.endAt));
      if (!busy) result.push({ startAt: slotStart, endAt: slotEnd });
      cursor.setTime(cursor.getTime() + stepMinutes * 60000);
    }
  }
  return result;
}

export function toUtcFromBusinessTime(date: string, time: string, timezone: string) {
  const assumed = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(assumed);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const asUtc = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour) % 24, Number(values.minute), Number(values.second));
  return new Date(assumed.getTime() - (asUtc - assumed.getTime()));
}

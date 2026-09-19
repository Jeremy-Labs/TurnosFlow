export type TimeBlock = { dayOfWeek: number; startTime: string; endTime: string };
export type ExistingAppointment = { startAt: Date; endAt: Date; status: string };
export type Slot = { startAt: Date; endAt: Date };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function overlaps(startAt: Date, endAt: Date, otherStart: Date, otherEnd: Date) {
  return startAt < otherEnd && endAt > otherStart;
}

export function assertIanaTimezone(timezone: string) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(); } catch { throw new Error("Timezone IANA inválida"); }
  return timezone;
}

export function assertBusinessDate(date: string) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!DATE_PATTERN.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error("Fecha de negocio inválida");
  return date;
}

export function nextBusinessDate(date: string) {
  assertBusinessDate(date);
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

function partsAt(instant: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(instant);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function toUtcFromBusinessTime(date: string, time: string, timezone: string) {
  assertBusinessDate(date); assertIanaTimezone(timezone);
  const target = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(target.getTime())) throw new Error("Hora de negocio inválida");
  let candidate = new Date(target);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = partsAt(candidate, timezone);
    const displayedAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute), Number(parts.second));
    const delta = target.getTime() - displayedAsUtc;
    if (delta === 0) return candidate;
    candidate = new Date(candidate.getTime() + delta);
  }
  throw new Error("La hora local no existe en esta timezone");
}

export function getBusinessDayBounds(date: string, timezone: string) {
  return { startAt: toUtcFromBusinessTime(date, "00:00", timezone), endAt: toUtcFromBusinessTime(nextBusinessDate(date), "00:00", timezone) };
}

export function businessDateFromInstant(instant: Date, timezone: string) {
  assertIanaTimezone(timezone);
  const parts = partsAt(instant, timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatBusinessTime(instant: Date | string, timezone: string) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(instant));
}

export function formatBusinessDateTime(instant: Date | string, timezone: string) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(instant));
}

export function generateSlots(date: string, timezone: string, durationMinutes: number, blocks: TimeBlock[], appointments: ExistingAppointment[], stepMinutes = durationMinutes): Slot[] {
  assertBusinessDate(date); assertIanaTimezone(timezone);
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0 || !Number.isInteger(stepMinutes) || stepMinutes <= 0) throw new Error("Duración inválida");
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
  const result: Slot[] = [];
  for (const block of blocks.filter((item) => item.dayOfWeek === dayOfWeek)) {
    const cursor = toUtcFromBusinessTime(date, block.startTime, timezone);
    const end = toUtcFromBusinessTime(date, block.endTime, timezone);
    for (let current = cursor; current.getTime() + durationMinutes * 60000 <= end.getTime(); current = new Date(current.getTime() + stepMinutes * 60000)) {
      const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
      if (!appointments.some((appointment) => appointment.status !== "CANCELLED" && overlaps(current, slotEnd, appointment.startAt, appointment.endAt))) result.push({ startAt: current, endAt: slotEnd });
    }
  }
  return result;
}

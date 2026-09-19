import { z } from "zod";
import { assertIanaTimezone } from "../domain/availability";
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usá el formato HH:mm");
export const serviceSchema = z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(500).optional(), durationMinutes: z.coerce.number().int().min(5).max(480), price: z.coerce.number().nonnegative().max(100000).optional() });
export const customerSchema = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().min(6).max(30), email: z.string().email().optional().or(z.literal("")), notes: z.string().max(1000).optional() });
export const bookingSchema = z.object({ businessSlug: z.string().min(1), serviceId: z.string().min(1), employeeId: z.string().min(1), startAt: z.coerce.date(), name: z.string().trim().min(2).max(120), phone: z.string().trim().min(6).max(30), email: z.string().email().optional().or(z.literal("")), notes: z.string().max(1000).optional() });
export const availabilitySchema = z.object({ dayOfWeek: z.coerce.number().int().min(0).max(6), startTime: timeSchema, endTime: timeSchema }).refine(({ startTime, endTime }) => startTime < endTime, { message: "La hora de inicio debe ser anterior a la de fin", path: ["endTime"] });
export const businessSchema = z.object({ name: z.string().trim().min(2).max(120), timezone: z.string().refine((value) => { try { assertIanaTimezone(value); return true; } catch { return false; } }, "Timezone IANA inválida") });

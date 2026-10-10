import { AppointmentStatus, Prisma } from "@prisma/client";
import { assertBusinessDate, businessDateFromInstant, getBusinessDayBounds } from "./domain/availability";
import { prisma } from "./prisma";

export interface AgendaFilterParams {
  date?: string;
  employeeId?: string;
  serviceId?: string;
  status?: string;
}

export interface SanitizedAgendaFilters {
  date: string;
  employeeId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
}

const VALID_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
];

export function getBusinessToday(timezone: string): string {
  return businessDateFromInstant(new Date(), timezone);
}

export function sanitizeAgendaFilters(
  params: AgendaFilterParams,
  businessTimezone: string
): SanitizedAgendaFilters {
  let date = params.date?.trim();
  if (date) {
    try {
      assertBusinessDate(date);
    } catch {
      date = getBusinessToday(businessTimezone);
    }
  } else {
    date = getBusinessToday(businessTimezone);
  }

  const employeeId = params.employeeId && params.employeeId !== "ALL" && params.employeeId.trim() !== ""
    ? params.employeeId.trim()
    : undefined;

  const serviceId = params.serviceId && params.serviceId !== "ALL" && params.serviceId.trim() !== ""
    ? params.serviceId.trim()
    : undefined;

  let status: AppointmentStatus | undefined;
  if (params.status && params.status !== "ALL" && VALID_STATUSES.includes(params.status as AppointmentStatus)) {
    status = params.status as AppointmentStatus;
  }

  return {
    date,
    employeeId,
    serviceId,
    status,
  };
}

export function buildAgendaWhereClause(
  businessId: string,
  filters: SanitizedAgendaFilters,
  businessTimezone: string
): Prisma.AppointmentWhereInput {
  const { startAt, endAt } = getBusinessDayBounds(filters.date, businessTimezone);

  const where: Prisma.AppointmentWhereInput = {
    businessId,
    startAt: {
      gte: startAt,
      lt: endAt,
    },
  };

  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }

  if (filters.serviceId) {
    where.serviceId = filters.serviceId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  return where;
}

export async function getAdminAgendaAppointments(
  businessId: string,
  filters: SanitizedAgendaFilters,
  businessTimezone: string
) {
  const where = buildAgendaWhereClause(businessId, filters, businessTimezone);

  return prisma.appointment.findMany({
    where,
    orderBy: { startAt: "asc" },
    include: {
      customer: true,
      service: true,
      employee: true,
    },
  });
}

export async function getAdminAgendaFilterOptions(businessId: string) {
  const [employees, services] = await Promise.all([
    prisma.employee.findMany({
      where: { businessId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.service.findMany({
      where: { businessId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, durationMinutes: true },
    }),
  ]);

  return { employees, services };
}

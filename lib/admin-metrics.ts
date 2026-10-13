import { AppointmentStatus } from "@prisma/client";
import {
  businessDateFromInstant,
  getBusinessDayBounds,
  getBusinessWeekBounds,
  type BusinessWeekBounds,
} from "./domain/availability";
import { prisma } from "./prisma";

export { getBusinessWeekBounds };
export type { BusinessWeekBounds };

export interface BusinessOperationalMetrics {
  todayAppointmentsCount: number;
  weekAppointmentsCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  totalCustomersCount: number;
  serviceCount: number;
  employeeCount: number;
  upcomingAppointments: Array<{
    id: string;
    startAt: Date;
    endAt: Date;
    status: AppointmentStatus;
    customer: { id: string; name: string; phone: string; email: string | null };
    service: { id: string; name: string; durationMinutes: number };
    employee: { id: string; name: string };
  }>;
  todayDate: string;
  weekStart: string;
  weekEnd: string;
}

export async function getBusinessOperationalMetrics(
  businessId: string,
  timezone: string,
  referenceDate?: Date | string
): Promise<BusinessOperationalMetrics> {
  const baseDate = referenceDate
    ? typeof referenceDate === "string"
      ? new Date(`${referenceDate}T12:00:00Z`)
      : referenceDate
    : new Date();

  const todayDate = businessDateFromInstant(baseDate, timezone);
  const todayBounds = getBusinessDayBounds(todayDate, timezone);
  const weekBounds = getBusinessWeekBounds(todayDate, timezone);

  const [
    todayAppointmentsCount,
    weekAppointmentsCount,
    confirmedCount,
    completedCount,
    cancelledCount,
    noShowCount,
    totalCustomersCount,
    serviceCount,
    employeeCount,
    upcomingAppointments,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        businessId,
        startAt: {
          gte: todayBounds.startAt,
          lt: todayBounds.endAt,
        },
      },
    }),
    prisma.appointment.count({
      where: {
        businessId,
        startAt: {
          gte: weekBounds.startAt,
          lt: weekBounds.endAt,
        },
      },
    }),
    prisma.appointment.count({
      where: {
        businessId,
        status: AppointmentStatus.CONFIRMED,
      },
    }),
    prisma.appointment.count({
      where: {
        businessId,
        status: AppointmentStatus.COMPLETED,
      },
    }),
    prisma.appointment.count({
      where: {
        businessId,
        status: AppointmentStatus.CANCELLED,
      },
    }),
    prisma.appointment.count({
      where: {
        businessId,
        status: AppointmentStatus.NO_SHOW,
      },
    }),
    prisma.customer.count({
      where: {
        businessId,
      },
    }),
    prisma.service.count({
      where: {
        businessId,
        active: true,
      },
    }),
    prisma.employee.count({
      where: {
        businessId,
        active: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        businessId,
        startAt: {
          gte: todayBounds.startAt,
        },
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
      orderBy: {
        startAt: "asc",
      },
      take: 5,
      include: {
        customer: true,
        service: true,
        employee: true,
      },
    }),
  ]);

  return {
    todayAppointmentsCount,
    weekAppointmentsCount,
    confirmedCount,
    completedCount,
    cancelledCount,
    noShowCount,
    totalCustomersCount,
    serviceCount,
    employeeCount,
    upcomingAppointments,
    todayDate,
    weekStart: weekBounds.monday,
    weekEnd: weekBounds.sunday,
  };
}

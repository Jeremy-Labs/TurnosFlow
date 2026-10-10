import { AppointmentStatus, Prisma } from "@prisma/client";
import { assertRequestedSlot, getPublicAvailability } from "./availability-service";
import { businessDateFromInstant } from "./domain/availability";
import { assertValidStatusTransition } from "./domain/appointment-lifecycle";
import { prisma } from "./prisma";

export class PublicBookingNotFoundError extends Error {
  constructor(message = "Reserva no encontrada") {
    super(message);
    this.name = "PublicBookingNotFoundError";
  }
}

export class PublicBookingConflictError extends Error {
  constructor(message = "El horario seleccionado no está disponible") {
    super(message);
    this.name = "PublicBookingConflictError";
  }
}

export class PublicBookingLifecycleError extends Error {
  constructor(message = "La reserva no puede modificarse en su estado actual") {
    super(message);
    this.name = "PublicBookingLifecycleError";
  }
}

function isRetryableSerializationError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2034", "P2002", "P2004"].includes(error.code)
  );
}

export async function getPublicBooking(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          timezone: true,
          phone: true,
          email: true,
          address: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          price: true,
        },
      },
      employee: {
        select: {
          id: true,
          name: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new PublicBookingNotFoundError();
  }

  return appointment;
}

export async function cancelPublicBooking(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new PublicBookingNotFoundError();
  }

  // Validar si el estado permite transición a CANCELLED
  try {
    assertValidStatusTransition(appointment.status, AppointmentStatus.CANCELLED);
  } catch {
    throw new PublicBookingLifecycleError(
      `No se puede cancelar una reserva en estado ${appointment.status}`
    );
  }

  return prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: AppointmentStatus.CANCELLED },
    include: {
      business: true,
      service: true,
      employee: true,
      customer: true,
    },
  });
}

export async function reschedulePublicBooking(appointmentId: string, newStartAt: Date) {
  if (newStartAt.getTime() <= Date.now()) {
    throw new PublicBookingConflictError("El nuevo horario debe ser en el futuro");
  }

  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      business: true,
      service: true,
      employee: true,
    },
  });

  if (!existing) {
    throw new PublicBookingNotFoundError();
  }

  // Estados terminales no se pueden reprogramar
  if (
    existing.status === AppointmentStatus.CANCELLED ||
    existing.status === AppointmentStatus.COMPLETED ||
    existing.status === AppointmentStatus.NO_SHOW
  ) {
    throw new PublicBookingLifecycleError(
      `No se puede reprogramar una reserva en estado ${existing.status}`
    );
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const date = businessDateFromInstant(newStartAt, existing.business.timezone);

          const availability = await getPublicAvailability(tx, {
            businessSlug: existing.business.slug,
            serviceId: existing.serviceId,
            employeeId: existing.employeeId,
            date,
          });

          try {
            assertRequestedSlot(availability.slots, newStartAt);
          } catch {
            throw new PublicBookingConflictError("El nuevo horario no está disponible");
          }

          const endAt = new Date(
            newStartAt.getTime() + existing.service.durationMinutes * 60000
          );

          return tx.appointment.update({
            where: { id: existing.id },
            data: {
              startAt: newStartAt,
              endAt,
            },
            include: {
              business: true,
              service: true,
              employee: true,
              customer: true,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (isRetryableSerializationError(error) && attempt === 0) continue;
      if (isRetryableSerializationError(error)) {
        throw new PublicBookingConflictError("El horario acaba de reservarse. Elegí otro.");
      }
      throw error;
    }
  }

  throw new PublicBookingConflictError("El horario acaba de reservarse. Elegí otro.");
}

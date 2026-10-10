import { describe, expect, it, vi } from "vitest";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  cancelPublicBooking,
  getPublicBooking,
  PublicBookingConflictError,
  PublicBookingLifecycleError,
  PublicBookingNotFoundError,
  reschedulePublicBooking,
} from "@/lib/public-manage-booking";

describe("public manage booking service", () => {
  describe("getPublicBooking", () => {
    it("returns appointment details with public-safe fields", async () => {
      const mock = {
        id: "apt-123",
        startAt: new Date("2030-01-07T10:00:00Z"),
        endAt: new Date("2030-01-07T10:30:00Z"),
        status: AppointmentStatus.CONFIRMED,
        business: {
          id: "biz-1",
          name: "Barbería Central",
          slug: "barberia-central",
          timezone: "Europe/Madrid",
        },
        service: {
          id: "srv-1",
          name: "Corte",
          durationMinutes: 30,
        },
        employee: {
          id: "emp-1",
          name: "Juan",
        },
        customer: {
          id: "cust-1",
          name: "Lucía García",
          phone: "+34 611 222 333",
        },
      };

      vi.spyOn(prisma.appointment, "findUnique").mockResolvedValueOnce(mock as any);

      const result = await getPublicBooking("apt-123");
      expect(result.id).toBe("apt-123");
      expect(result.business.slug).toBe("barberia-central");
      expect(result.customer.name).toBe("Lucía García");
    });

    it("throws PublicBookingNotFoundError when appointment does not exist", async () => {
      vi.spyOn(prisma.appointment, "findUnique").mockResolvedValueOnce(null);

      await expect(getPublicBooking("non-existent")).rejects.toThrow(
        PublicBookingNotFoundError
      );
    });
  });

  describe("cancelPublicBooking", () => {
    it("cancels an active CONFIRMED appointment successfully", async () => {
      const existing = {
        id: "apt-1",
        status: AppointmentStatus.CONFIRMED,
      };

      vi.spyOn(prisma.appointment, "findUnique").mockResolvedValueOnce(existing as any);
      const updateSpy = vi.spyOn(prisma.appointment, "update").mockResolvedValueOnce({
        ...existing,
        status: AppointmentStatus.CANCELLED,
      } as any);

      const result = await cancelPublicBooking("apt-1");
      expect(result.status).toBe(AppointmentStatus.CANCELLED);
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: "apt-1" },
        data: { status: AppointmentStatus.CANCELLED },
        include: expect.any(Object),
      });
    });

    it("cancels an active PENDING appointment successfully", async () => {
      const existing = {
        id: "apt-2",
        status: AppointmentStatus.PENDING,
      };

      vi.spyOn(prisma.appointment, "findUnique").mockResolvedValueOnce(existing as any);
      vi.spyOn(prisma.appointment, "update").mockResolvedValueOnce({
        ...existing,
        status: AppointmentStatus.CANCELLED,
      } as any);

      const result = await cancelPublicBooking("apt-2");
      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });

    it("throws PublicBookingLifecycleError when appointment is already CANCELLED", async () => {
      const existing = {
        id: "apt-cancelled",
        status: AppointmentStatus.CANCELLED,
      };

      vi.spyOn(prisma.appointment, "findUnique").mockResolvedValueOnce(existing as any);

      await expect(cancelPublicBooking("apt-cancelled")).rejects.toThrow(
        PublicBookingLifecycleError
      );
    });

    it("throws PublicBookingLifecycleError when appointment is already COMPLETED", async () => {
      const existing = {
        id: "apt-completed",
        status: AppointmentStatus.COMPLETED,
      };

      vi.spyOn(prisma.appointment, "findUnique").mockResolvedValueOnce(existing as any);

      await expect(cancelPublicBooking("apt-completed")).rejects.toThrow(
        PublicBookingLifecycleError
      );
    });
  });

  describe("reschedulePublicBooking", () => {
    it("rejects rescheduling to a past date", async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago

      await expect(reschedulePublicBooking("apt-1", pastDate)).rejects.toThrow(
        PublicBookingConflictError
      );
    });

    it("rejects rescheduling when appointment is in a terminal status (e.g. CANCELLED)", async () => {
      const futureDate = new Date(Date.now() + 86400000 * 5); // 5 days in future

      vi.spyOn(prisma.appointment, "findUnique").mockResolvedValueOnce({
        id: "apt-1",
        status: AppointmentStatus.CANCELLED,
        business: { slug: "test", timezone: "Europe/Madrid" },
      } as any);

      await expect(reschedulePublicBooking("apt-1", futureDate)).rejects.toThrow(
        PublicBookingLifecycleError
      );
    });
  });
});

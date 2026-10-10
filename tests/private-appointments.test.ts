import { describe, expect, it, vi } from "vitest";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  InvalidAppointmentTransitionError,
  PrivateResourceNotFoundError,
  updateAppointmentStatusForMember,
} from "@/lib/private-appointments";

describe("private appointments service and status updates", () => {
  it("rejects when the appointment is not found or does not belong to user business", async () => {
    vi.spyOn(prisma.appointment, "findFirst").mockResolvedValueOnce(null);

    await expect(
      updateAppointmentStatusForMember("user-1", "apt-unknown", AppointmentStatus.CONFIRMED)
    ).rejects.toThrow(PrivateResourceNotFoundError);
  });

  it("updates successfully when transition is valid (e.g. PENDING -> CONFIRMED)", async () => {
    vi.spyOn(prisma.appointment, "findFirst").mockResolvedValueOnce({
      id: "apt-1",
      businessId: "biz-1",
      status: AppointmentStatus.PENDING,
    } as any);

    const updateSpy = vi.spyOn(prisma.appointment, "update").mockResolvedValueOnce({
      id: "apt-1",
      businessId: "biz-1",
      status: AppointmentStatus.CONFIRMED,
    } as any);

    const result = await updateAppointmentStatusForMember(
      "user-1",
      "apt-1",
      AppointmentStatus.CONFIRMED
    );

    expect(result.status).toBe(AppointmentStatus.CONFIRMED);
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: "apt-1" },
      data: { status: AppointmentStatus.CONFIRMED },
    });
  });

  it("rejects with InvalidAppointmentTransitionError when transition is invalid (e.g. PENDING -> COMPLETED)", async () => {
    vi.spyOn(prisma.appointment, "findFirst").mockResolvedValueOnce({
      id: "apt-1",
      businessId: "biz-1",
      status: AppointmentStatus.PENDING,
    } as any);

    const updateSpy = vi.spyOn(prisma.appointment, "update");

    await expect(
      updateAppointmentStatusForMember("user-1", "apt-1", AppointmentStatus.COMPLETED)
    ).rejects.toThrow(InvalidAppointmentTransitionError);

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("rejects any transition attempt from terminal states (e.g. CANCELLED -> CONFIRMED)", async () => {
    vi.spyOn(prisma.appointment, "findFirst").mockResolvedValueOnce({
      id: "apt-1",
      businessId: "biz-1",
      status: AppointmentStatus.CANCELLED,
    } as any);

    const updateSpy = vi.spyOn(prisma.appointment, "update");

    await expect(
      updateAppointmentStatusForMember("user-1", "apt-1", AppointmentStatus.CONFIRMED)
    ).rejects.toThrow(InvalidAppointmentTransitionError);

    expect(updateSpy).not.toHaveBeenCalled();
  });
});

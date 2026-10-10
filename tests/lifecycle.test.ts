import { describe, expect, it } from "vitest";
import { AppointmentStatus } from "@prisma/client";
import {
  ALLOWED_TRANSITIONS,
  assertValidStatusTransition,
  getAllowedTransitions,
  InvalidAppointmentTransitionError,
  isValidStatusTransition,
} from "@/lib/domain/appointment-lifecycle";

describe("appointment lifecycle domain", () => {
  describe("PENDING status transitions", () => {
    it("allows PENDING -> CONFIRMED", () => {
      expect(isValidStatusTransition(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED)).toBe(true);
      expect(() => assertValidStatusTransition(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED)).not.toThrow();
    });

    it("allows PENDING -> CANCELLED", () => {
      expect(isValidStatusTransition(AppointmentStatus.PENDING, AppointmentStatus.CANCELLED)).toBe(true);
      expect(() => assertValidStatusTransition(AppointmentStatus.PENDING, AppointmentStatus.CANCELLED)).not.toThrow();
    });

    it("disallows PENDING -> COMPLETED directly without confirmation", () => {
      expect(isValidStatusTransition(AppointmentStatus.PENDING, AppointmentStatus.COMPLETED)).toBe(false);
      expect(() => assertValidStatusTransition(AppointmentStatus.PENDING, AppointmentStatus.COMPLETED)).toThrow(
        InvalidAppointmentTransitionError
      );
    });

    it("disallows PENDING -> NO_SHOW directly without confirmation", () => {
      expect(isValidStatusTransition(AppointmentStatus.PENDING, AppointmentStatus.NO_SHOW)).toBe(false);
      expect(() => assertValidStatusTransition(AppointmentStatus.PENDING, AppointmentStatus.NO_SHOW)).toThrow(
        InvalidAppointmentTransitionError
      );
    });

    it("disallows PENDING -> PENDING (self-transition)", () => {
      expect(isValidStatusTransition(AppointmentStatus.PENDING, AppointmentStatus.PENDING)).toBe(false);
    });
  });

  describe("CONFIRMED status transitions", () => {
    it("allows CONFIRMED -> COMPLETED", () => {
      expect(isValidStatusTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED)).toBe(true);
      expect(() => assertValidStatusTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED)).not.toThrow();
    });

    it("allows CONFIRMED -> CANCELLED", () => {
      expect(isValidStatusTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED)).toBe(true);
      expect(() => assertValidStatusTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED)).not.toThrow();
    });

    it("allows CONFIRMED -> NO_SHOW", () => {
      expect(isValidStatusTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.NO_SHOW)).toBe(true);
      expect(() => assertValidStatusTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.NO_SHOW)).not.toThrow();
    });

    it("disallows reverting CONFIRMED -> PENDING", () => {
      expect(isValidStatusTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING)).toBe(false);
      expect(() => assertValidStatusTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING)).toThrow(
        InvalidAppointmentTransitionError
      );
    });
  });

  describe("Terminal states (COMPLETED, CANCELLED, NO_SHOW)", () => {
    const allStatuses = Object.values(AppointmentStatus);

    it("disallows any transition from COMPLETED", () => {
      expect(getAllowedTransitions(AppointmentStatus.COMPLETED)).toEqual([]);
      for (const target of allStatuses) {
        expect(isValidStatusTransition(AppointmentStatus.COMPLETED, target)).toBe(false);
        expect(() => assertValidStatusTransition(AppointmentStatus.COMPLETED, target)).toThrow(
          InvalidAppointmentTransitionError
        );
      }
    });

    it("disallows any transition from CANCELLED", () => {
      expect(getAllowedTransitions(AppointmentStatus.CANCELLED)).toEqual([]);
      for (const target of allStatuses) {
        expect(isValidStatusTransition(AppointmentStatus.CANCELLED, target)).toBe(false);
        expect(() => assertValidStatusTransition(AppointmentStatus.CANCELLED, target)).toThrow(
          InvalidAppointmentTransitionError
        );
      }
    });

    it("disallows any transition from NO_SHOW", () => {
      expect(getAllowedTransitions(AppointmentStatus.NO_SHOW)).toEqual([]);
      for (const target of allStatuses) {
        expect(isValidStatusTransition(AppointmentStatus.NO_SHOW, target)).toBe(false);
        expect(() => assertValidStatusTransition(AppointmentStatus.NO_SHOW, target)).toThrow(
          InvalidAppointmentTransitionError
        );
      }
    });
  });

  describe("transition list integrity", () => {
    it("returns correct available transitions for every status", () => {
      expect(getAllowedTransitions(AppointmentStatus.PENDING)).toEqual([
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
      ]);
      expect(getAllowedTransitions(AppointmentStatus.CONFIRMED)).toEqual([
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
      ]);
      expect(getAllowedTransitions(AppointmentStatus.COMPLETED)).toEqual([]);
      expect(getAllowedTransitions(AppointmentStatus.CANCELLED)).toEqual([]);
      expect(getAllowedTransitions(AppointmentStatus.NO_SHOW)).toEqual([]);
    });

    it("includes typed error properties in InvalidAppointmentTransitionError", () => {
      try {
        assertValidStatusTransition(AppointmentStatus.COMPLETED, AppointmentStatus.CONFIRMED);
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidAppointmentTransitionError);
        const transitionError = error as InvalidAppointmentTransitionError;
        expect(transitionError.currentStatus).toBe(AppointmentStatus.COMPLETED);
        expect(transitionError.targetStatus).toBe(AppointmentStatus.CONFIRMED);
        expect(transitionError.message).toContain("COMPLETED");
        expect(transitionError.message).toContain("CONFIRMED");
      }
    });
  });
});

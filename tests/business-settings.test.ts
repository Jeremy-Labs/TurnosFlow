import { describe, expect, it, vi } from "vitest";
import { MembershipRole } from "@prisma/client";
import {
  BusinessSettingsForbiddenError,
  BusinessSlugConflictError,
  businessSettingsSchema,
  updateBusinessSettings,
} from "@/lib/admin-business-settings";
import { prisma } from "@/lib/prisma";

describe("Business Settings Domain and Service", () => {
  describe("businessSettingsSchema validation", () => {
    it("validates and parses correct business settings input", () => {
      const input = {
        name: "  Barbería Central  ",
        slug: "barberia-central",
        timezone: "Europe/Madrid",
        description: "  La mejor barbería de la ciudad  ",
        phone: "  +34 600 123 456  ",
        email: "  contacto@barberiacentral.com  ",
        address: "  Gran Vía 10  ",
      };

      const result = businessSettingsSchema.parse(input);

      expect(result.name).toBe("Barbería Central");
      expect(result.slug).toBe("barberia-central");
      expect(result.timezone).toBe("Europe/Madrid");
      expect(result.description).toBe("La mejor barbería de la ciudad");
      expect(result.phone).toBe("+34 600 123 456");
      expect(result.email).toBe("contacto@barberiacentral.com");
      expect(result.address).toBe("Gran Vía 10");
    });

    it("sanitizes empty or whitespace strings to null for optional fields", () => {
      const input = {
        name: "Barbería Central",
        slug: "barberia-central",
        timezone: "America/Argentina/Buenos_Aires",
        description: "   ",
        phone: "",
        email: "",
        address: null,
      };

      const result = businessSettingsSchema.parse(input);

      expect(result.description).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.email).toBeNull();
      expect(result.address).toBeNull();
    });

    it("rejects invalid slugs", () => {
      const invalidSlugs = [
        "ab", // too short (< 3)
        "Barberia-Central", // uppercase (schema converts lowercase or test regex)
        "barberia central", // spaces
        "-barberia", // leading dash
        "barberia-", // trailing dash
        "barberia--central", // double dash
        "barberia_central", // underscore
        "barberia!", // special chars
      ];

      for (const slug of invalidSlugs) {
        expect(() =>
          businessSettingsSchema.parse({
            name: "Test Biz",
            slug,
            timezone: "UTC",
          })
        ).toThrow();
      }
    });

    it("rejects invalid IANA timezones", () => {
      const invalidTimezones = ["Invalid/Timezone", "NotATimezone", "Mars/Crater"];

      for (const timezone of invalidTimezones) {
        expect(() =>
          businessSettingsSchema.parse({
            name: "Test Biz",
            slug: "test-biz",
            timezone,
          })
        ).toThrow(/Timezone IANA/);
      }
    });

    it("rejects invalid email formats", () => {
      expect(() =>
        businessSettingsSchema.parse({
          name: "Test Biz",
          slug: "test-biz",
          timezone: "UTC",
          email: "not-an-email",
        })
      ).toThrow();
    });
  });

  describe("updateBusinessSettings", () => {
    const validPayload = {
      name: "Barbería Actualizada",
      slug: "barberia-actualizada",
      timezone: "Europe/Madrid",
      description: "Nueva descripción",
      phone: "+34 699 999 999",
      email: "info@barberia.com",
      address: "Calle Nueva 123",
    };

    it("throws BusinessSettingsForbiddenError when user role is STAFF", async () => {
      await expect(
        updateBusinessSettings("biz-1", MembershipRole.STAFF, validPayload)
      ).rejects.toThrow(BusinessSettingsForbiddenError);
    });

    it("throws BusinessSlugConflictError when slug is already taken by another business", async () => {
      vi.spyOn(prisma.business, "findFirst").mockResolvedValueOnce({
        id: "biz-other",
      } as any);

      await expect(
        updateBusinessSettings("biz-1", MembershipRole.OWNER, validPayload)
      ).rejects.toThrow(BusinessSlugConflictError);

      expect(prisma.business.findFirst).toHaveBeenCalledWith({
        where: {
          slug: "barberia-actualizada",
          id: { not: "biz-1" },
        },
        select: { id: true },
      });
    });

    it("updates business settings successfully for OWNER role", async () => {
      vi.spyOn(prisma.business, "findFirst").mockResolvedValueOnce(null);
      const updateSpy = vi.spyOn(prisma.business, "update").mockResolvedValueOnce({
        id: "biz-1",
        ...validPayload,
      } as any);

      const result = await updateBusinessSettings(
        "biz-1",
        MembershipRole.OWNER,
        validPayload
      );

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: "biz-1" },
        data: {
          name: "Barbería Actualizada",
          slug: "barberia-actualizada",
          timezone: "Europe/Madrid",
          description: "Nueva descripción",
          phone: "+34 699 999 999",
          email: "info@barberia.com",
          address: "Calle Nueva 123",
        },
      });
      expect(result.name).toBe("Barbería Actualizada");
    });

    it("updates business settings successfully for ADMIN role", async () => {
      vi.spyOn(prisma.business, "findFirst").mockResolvedValueOnce(null);
      const updateSpy = vi.spyOn(prisma.business, "update").mockResolvedValueOnce({
        id: "biz-1",
        ...validPayload,
      } as any);

      const result = await updateBusinessSettings(
        "biz-1",
        MembershipRole.ADMIN,
        validPayload
      );

      expect(updateSpy).toHaveBeenCalled();
      expect(result.id).toBe("biz-1");
    });
  });
});

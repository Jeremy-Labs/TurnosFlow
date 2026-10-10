import { describe, expect, it, vi } from "vitest";
import { CustomerNotFoundError, getBusinessCustomers, getCustomerDetails } from "@/lib/admin-customers";
import { prisma } from "@/lib/prisma";

describe("admin customers service and tenant isolation", () => {
  describe("getBusinessCustomers", () => {
    it("strictly isolates queries by businessId", async () => {
      const findManySpy = vi.spyOn(prisma.customer, "findMany").mockResolvedValueOnce([]);

      await getBusinessCustomers("biz-target-1");

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId: "biz-target-1",
          },
          orderBy: { name: "asc" },
        })
      );
    });

    it("applies case-insensitive search across name, phone and email", async () => {
      const findManySpy = vi.spyOn(prisma.customer, "findMany").mockResolvedValueOnce([]);

      await getBusinessCustomers("biz-target-1", "Lucia");

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId: "biz-target-1",
            OR: [
              { name: { contains: "Lucia", mode: "insensitive" } },
              { phone: { contains: "Lucia", mode: "insensitive" } },
              { email: { contains: "Lucia", mode: "insensitive" } },
            ],
          },
        })
      );
    });
  });

  describe("getCustomerDetails", () => {
    it("returns customer and history when customerId belongs to businessId", async () => {
      const mockCustomer = {
        id: "cust-1",
        businessId: "biz-1",
        name: "Lucía García",
        phone: "+34 611 222 333",
        appointments: [
          {
            id: "apt-1",
            startAt: new Date("2030-01-07T10:00:00Z"),
            service: { name: "Corte" },
            employee: { name: "Juan" },
          },
        ],
        _count: { appointments: 1 },
      };

      vi.spyOn(prisma.customer, "findFirst").mockResolvedValueOnce(mockCustomer as any);

      const customer = await getCustomerDetails("biz-1", "cust-1");

      expect(customer).toEqual(mockCustomer);
      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: {
          id: "cust-1",
          businessId: "biz-1",
        },
        include: {
          appointments: {
            orderBy: { startAt: "desc" },
            include: {
              service: true,
              employee: true,
            },
          },
          _count: {
            select: { appointments: true },
          },
        },
      });
    });

    it("throws CustomerNotFoundError when customerId belongs to a different business (tenant isolation)", async () => {
      vi.spyOn(prisma.customer, "findFirst").mockResolvedValueOnce(null);

      await expect(
        getCustomerDetails("biz-attacker", "cust-from-another-biz")
      ).rejects.toThrow(CustomerNotFoundError);
    });
  });
});

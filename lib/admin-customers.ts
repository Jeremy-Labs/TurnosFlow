import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export class CustomerNotFoundError extends Error {
  constructor(message = "Cliente no encontrado") {
    super(message);
    this.name = "CustomerNotFoundError";
  }
}

export async function getBusinessCustomers(businessId: string, search?: string) {
  const where: Prisma.CustomerWhereInput = {
    businessId,
  };

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    where.OR = [
      { name: { contains: trimmedSearch, mode: "insensitive" } },
      { phone: { contains: trimmedSearch, mode: "insensitive" } },
      { email: { contains: trimmedSearch, mode: "insensitive" } },
    ];
  }

  return prisma.customer.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { appointments: true },
      },
      appointments: {
        orderBy: { startAt: "desc" },
        take: 1,
        select: { startAt: true },
      },
    },
  });
}

export async function getCustomerDetails(businessId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId,
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

  if (!customer) {
    throw new CustomerNotFoundError();
  }

  return customer;
}

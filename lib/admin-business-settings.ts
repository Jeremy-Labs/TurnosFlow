import { MembershipRole } from "@prisma/client";
import { z } from "zod";
import { assertIanaTimezone } from "./domain/availability";
import { canManageBusiness } from "./permissions";
import { prisma } from "./prisma";

export class BusinessSettingsForbiddenError extends Error {
  constructor(message = "No tienes permisos para modificar la configuración del negocio") {
    super(message);
    this.name = "BusinessSettingsForbiddenError";
  }
}

export class BusinessSlugConflictError extends Error {
  constructor(message = "El slug ya está en uso por otro negocio") {
    super(message);
    this.name = "BusinessSlugConflictError";
  }
}

const optionalSanitizedString = (maxChars: number, maxMsg: string) =>
  z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? null : val),
    z
      .string()
      .trim()
      .max(maxChars, maxMsg)
      .optional()
      .nullable()
      .transform((val) => (val && typeof val === "string" && val.trim().length > 0 ? val.trim() : null))
  );

const optionalSanitizedEmail = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? null : val),
  z
    .string()
    .trim()
    .email("Email inválido")
    .max(120, "El email no puede superar los 120 caracteres")
    .optional()
    .nullable()
    .transform((val) => (val && typeof val === "string" && val.trim().length > 0 ? val.trim() : null))
);

export const businessSettingsSchema = z.object({
  name: z
    .string({ required_error: "El nombre es requerido" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no puede superar los 120 caracteres"),
  slug: z
    .string({ required_error: "El slug es requerido" })
    .trim()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .max(60, "El slug no puede superar los 60 caracteres")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El slug solo puede contener letras minúsculas, números y guiones medios"
    ),
  timezone: z
    .string({ required_error: "La zona horaria es requerida" })
    .trim()
    .refine((val) => {
      try {
        assertIanaTimezone(val);
        return true;
      } catch {
        return false;
      }
    }, "Timezone IANA inválida"),
  description: optionalSanitizedString(500, "La descripción no puede superar los 500 caracteres"),
  phone: optionalSanitizedString(30, "El teléfono no puede superar los 30 caracteres"),
  email: optionalSanitizedEmail,
  address: optionalSanitizedString(200, "La dirección no puede superar los 200 caracteres"),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;

export async function getBusinessSettings(businessId: string) {
  return await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
  });
}

export async function updateBusinessSettings(
  businessId: string,
  role: MembershipRole,
  input: unknown
) {
  if (!canManageBusiness(role)) {
    throw new BusinessSettingsForbiddenError(
      "No tienes permisos para modificar la configuración del negocio"
    );
  }

  const data = businessSettingsSchema.parse(input);

  const existingWithSlug = await prisma.business.findFirst({
    where: {
      slug: data.slug,
      id: { not: businessId },
    },
    select: { id: true },
  });

  if (existingWithSlug) {
    throw new BusinessSlugConflictError(`El slug "${data.slug}" ya está en uso por otro negocio`);
  }

  return await prisma.business.update({
    where: { id: businessId },
    data: {
      name: data.name,
      slug: data.slug,
      timezone: data.timezone,
      description: data.description,
      phone: data.phone,
      email: data.email,
      address: data.address,
    },
  });
}

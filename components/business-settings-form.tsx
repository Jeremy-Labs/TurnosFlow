"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MembershipRole } from "@prisma/client";

interface BusinessSettingsFormProps {
  business: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    timezone: string;
  };
  role: MembershipRole;
  isManager: boolean;
}

const COMMON_TIMEZONES = [
  "Europe/Madrid",
  "America/Argentina/Buenos_Aires",
  "America/Mexico_City",
  "America/Bogota",
  "America/Santiago",
  "America/Lima",
  "America/Montevideo",
  "America/New_York",
  "Europe/London",
  "UTC",
];

export function BusinessSettingsForm({
  business,
  role,
  isManager,
}: BusinessSettingsFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: business.name,
    slug: business.slug,
    timezone: business.timezone,
    description: business.description ?? "",
    phone: business.phone ?? "",
    email: business.email ?? "",
    address: business.address ?? "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/business/${business.slug}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: data?.error || "Error al guardar la configuración.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: "Configuración guardada correctamente.",
      });

      if (data.slug && data.slug !== business.slug) {
        router.push(`/dashboard/${data.slug}/configuracion`);
      } else {
        router.refresh();
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Error de red al conectar con el servidor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl bg-white p-6 shadow-sm"
      aria-label="Configuración del negocio"
    >
      {!isManager && (
        <div
          data-testid="readonly-notice"
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <p className="font-semibold">Modo solo lectura ({role})</p>
          <p className="mt-0.5">
            Solo los administradores o propietarios tienen permisos para editar la
            información del negocio.
          </p>
        </div>
      )}

      {feedback && (
        <div
          data-testid={
            feedback.type === "success"
              ? "settings-success-message"
              : "settings-error-message"
          }
          className={`rounded-lg border p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "border-teal-200 bg-teal-50 text-teal-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Nombre */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700"
          >
            Nombre del negocio *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            disabled={!isManager || isSubmitting}
            value={formData.name}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        {/* Slug */}
        <div>
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-slate-700"
          >
            Slug (identificador web) *
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            disabled={!isManager || isSubmitting}
            value={formData.slug}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:text-slate-500 font-mono text-xs"
          />
          <p className="mt-1 text-xs text-slate-500">
            Página pública: /b/{formData.slug || "..."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Timezone */}
        <div>
          <label
            htmlFor="timezone"
            className="block text-sm font-medium text-slate-700"
          >
            Zona horaria *
          </label>
          <input
            id="timezone"
            name="timezone"
            type="text"
            list="timezone-options"
            required
            disabled={!isManager || isSubmitting}
            value={formData.timezone}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:text-slate-500"
          />
          <datalist id="timezone-options">
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-slate-500">
            Identificador IANA (ej. Europe/Madrid o America/Argentina/Buenos_Aires).
          </p>
        </div>

        {/* Teléfono */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-700"
          >
            Teléfono de contacto
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            disabled={!isManager || isSubmitting}
            value={formData.phone}
            onChange={handleChange}
            placeholder="+34 600 000 000"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Email de contacto
          </label>
          <input
            id="email"
            name="email"
            type="email"
            disabled={!isManager || isSubmitting}
            value={formData.email}
            onChange={handleChange}
            placeholder="contacto@negocio.com"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        {/* Dirección */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-slate-700"
          >
            Dirección física
          </label>
          <input
            id="address"
            name="address"
            type="text"
            disabled={!isManager || isSubmitting}
            value={formData.address}
            onChange={handleChange}
            placeholder="Calle Mayor 12, Ciudad"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-700"
        >
          Descripción del negocio
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          disabled={!isManager || isSubmitting}
          value={formData.description}
          onChange={handleChange}
          placeholder="Breve presentación de los servicios y horarios..."
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:text-slate-500"
        />
      </div>

      {isManager && (
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
    </form>
  );
}

"use client";

import { useState } from "react";
import { AppointmentStatus as StatusEnum } from "@prisma/client";
import { getAllowedTransitions } from "@/lib/domain/appointment-lifecycle";

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  CONFIRMED: {
    label: "CONFIRMED",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
  },
  PENDING: {
    label: "PENDING",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  COMPLETED: {
    label: "COMPLETED",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
  },
  CANCELLED: {
    label: "CANCELLED",
    badgeClass: "bg-red-50 text-red-800 border-red-200",
  },
  NO_SHOW: {
    label: "NO_SHOW",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  },
};

export function AppointmentStatus({ id, status }: { id: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allowed = getAllowedTransitions(current as StatusEnum);

  const update = async (next: string) => {
    if (next === current || loading) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (response.ok) {
        setCurrent(next);
      } else {
        const data = await response.json().catch(() => null);
        setErrorMessage(data?.error ?? "Error al actualizar estado");
      }
    } catch {
      setErrorMessage("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = STATUS_CONFIG[current] ?? {
    label: current,
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${currentConfig.badgeClass}`}
        >
          {currentConfig.label}
        </span>

        {allowed.length > 0 ? (
          <select
            aria-label="Estado del turno"
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-50"
            value={current}
            disabled={loading}
            onChange={(e) => update(e.target.value)}
          >
            <option value={current} disabled>
              Cambiar a...
            </option>
            {allowed.map((target) => (
              <option key={target} value={target}>
                {target}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-slate-400 italic">Estado final</span>
        )}
      </div>

      {errorMessage && (
        <span className="text-xs text-red-600 font-medium">{errorMessage}</span>
      )}
    </div>
  );
}

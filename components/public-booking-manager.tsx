"use client";

import { useState } from "react";
import { formatBusinessDateTime, formatBusinessTime } from "@/lib/domain/availability";

interface PublicBookingManagerProps {
  initialAppointment: {
    id: string;
    startAt: string;
    endAt: string;
    status: string;
    notes?: string | null;
    business: {
      id: string;
      name: string;
      slug: string;
      timezone: string;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
    };
    service: {
      id: string;
      name: string;
      durationMinutes: number;
      price?: unknown;
    };
    employee: {
      id: string;
      name: string;
    };
    customer: {
      id: string;
      name: string;
      phone: string;
      email?: string | null;
    };
  };
}

const STATUS_BADGES: Record<string, { label: string; badgeClass: string }> = {
  CONFIRMED: {
    label: "CONFIRMADA",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
  },
  PENDING: {
    label: "PENDIENTE",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  COMPLETED: {
    label: "COMPLETADA",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
  },
  CANCELLED: {
    label: "CANCELADA",
    badgeClass: "bg-red-50 text-red-800 border-red-200",
  },
  NO_SHOW: {
    label: "NO ASISTIÓ",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  },
};

export function PublicBookingManager({ initialAppointment }: PublicBookingManagerProps) {
  const [appointment, setAppointment] = useState(initialAppointment);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estados para reprogramación
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ startAt: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  const isActive = appointment.status === "PENDING" || appointment.status === "CONFIRMED";
  const statusInfo = STATUS_BADGES[appointment.status] ?? {
    label: appointment.status,
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const formattedStart = formatBusinessDateTime(
    appointment.startAt,
    appointment.business.timezone
  );
  const priceValue = appointment.service.price ? Number(appointment.service.price) : null;

  const handleCancel = async () => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta reserva?")) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/public/bookings/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = await response.json();

      if (response.ok) {
        setAppointment((prev) => ({ ...prev, status: "CANCELLED" }));
        setMessage({ type: "success", text: "Tu reserva ha sido cancelada correctamente." });
        setIsRescheduling(false);
      } else {
        setMessage({ type: "error", text: data.error || "No se pudo cancelar la reserva." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de red al intentar cancelar." });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSlots = async () => {
    if (!newDate) return;
    setLoadingSlots(true);
    setSelectedSlot("");
    setAvailableSlots([]);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/public/slots?businessSlug=${appointment.business.slug}&serviceId=${appointment.service.id}&employeeId=${appointment.employee.id}&date=${newDate}`
      );
      const data = await response.json();

      if (response.ok) {
        setAvailableSlots(data.slots || []);
        if (!data.slots || data.slots.length === 0) {
          setMessage({ type: "error", text: "No hay horarios disponibles para la fecha seleccionada." });
        }
      } else {
        setMessage({ type: "error", text: data.error || "Error al buscar horarios." });
      }
    } catch {
      setMessage({ type: "error", text: "Error al comunicarse con el servidor." });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedSlot) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/public/bookings/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", startAt: selectedSlot }),
      });

      const data = await response.json();

      if (response.ok) {
        setAppointment((prev) => ({
          ...prev,
          startAt: data.startAt,
          endAt: data.endAt,
        }));
        setMessage({
          type: "success",
          text: `Tu reserva fue reprogramada con éxito para el ${formatBusinessDateTime(
            data.startAt,
            appointment.business.timezone
          )}.`,
        });
        setIsRescheduling(false);
        setNewDate("");
        setSelectedSlot("");
        setAvailableSlots([]);
      } else {
        setMessage({ type: "error", text: data.error || "No se pudo reprogramar la reserva." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión al reprogramar." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mensajes de notificación */}
      {message && (
        <div
          role="alert"
          className={`rounded-xl p-4 text-sm font-medium ${
            message.type === "success"
              ? "bg-teal-50 text-teal-800 border border-teal-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tarjeta de la reserva */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Detalle de Reserva
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {appointment.business.name}
            </h2>
          </div>
          <span
            data-testid="booking-status-badge"
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.badgeClass}`}
          >
            {statusInfo.label}
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-medium text-slate-400">Fecha y horario</span>
              <span className="text-base font-semibold text-slate-800">{formattedStart}</span>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-400">Servicio</span>
              <span className="text-base font-semibold text-slate-800">
                {appointment.service.name} ({appointment.service.durationMinutes} min)
              </span>
              {priceValue !== null && (
                <span className="block text-xs text-slate-500 font-medium">${priceValue}</span>
              )}
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-400">Profesional</span>
              <span className="text-sm text-slate-800 font-medium">{appointment.employee.name}</span>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-400">Titular</span>
              <span className="text-sm text-slate-800 font-medium">{appointment.customer.name}</span>
              <span className="block text-xs text-slate-500">Tel: {appointment.customer.phone}</span>
            </div>
          </div>

          {appointment.business.address && (
            <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
              📍 Dirección: {appointment.business.address}
            </div>
          )}
        </div>

        {/* Acciones principales */}
        <div className="border-t border-slate-100 bg-slate-50 p-6">
          {isActive ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Cancelar reserva"}
              </button>

              <button
                type="button"
                onClick={() => setIsRescheduling(!isRescheduling)}
                disabled={loading}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
              >
                {isRescheduling ? "Cerrar reprogramación" : "Reprogramar horario"}
              </button>
            </div>
          ) : (
            <div className="text-center text-sm text-slate-500 italic">
              Esta reserva se encuentra en estado {statusInfo.label.toLowerCase()} y ya no puede ser cancelada ni reprogramada.
            </div>
          )}
        </div>
      </div>

      {/* Panel de Reprogramación */}
      {isRescheduling && isActive && (
        <section
          aria-label="Formulario de reprogramación"
          className="rounded-2xl bg-white p-6 shadow-sm border border-teal-100 space-y-4"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Elegir nuevo día y horario
          </h3>
          <p className="text-xs text-slate-500">
            Mismo profesional ({appointment.employee.name}) y servicio ({appointment.service.name}).
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="reschedule-date" className="block text-xs font-medium text-slate-700 mb-1">
                Nueva fecha
              </label>
              <input
                id="reschedule-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleLoadSlots}
              disabled={!newDate || loadingSlots}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loadingSlots ? "Buscando..." : "Buscar horarios disponibles"}
            </button>
          </div>

          {availableSlots.length > 0 && (
            <div className="space-y-3 pt-2">
              <label htmlFor="reschedule-slot" className="block text-xs font-medium text-slate-700">
                Seleccionar nuevo horario
              </label>
              <select
                id="reschedule-slot"
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              >
                <option value="">-- Elige un horario --</option>
                {availableSlots.map((s) => (
                  <option key={s.startAt} value={s.startAt}>
                    {formatBusinessTime(s.startAt, appointment.business.timezone)}
                  </option>
                ))}
              </select>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleConfirmReschedule}
                  disabled={!selectedSlot || loading}
                  className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
                >
                  {loading ? "Confirmando..." : "Confirmar nuevo horario"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

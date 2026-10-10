"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  business: { slug: string; timezone: string };
  services: { id: string; name: string; durationMinutes: number; price: string | null }[];
  employees: { id: string; name: string; serviceIds: string[] }[];
};

export function BookingForm({ business, services, employees }: Props) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [slots, setSlots] = useState<{ startAt: string }[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [message, setMessage] = useState("");
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  const selected = services.find((x) => x.id === serviceId);
  const availableEmployees = useMemo(
    () => employees.filter((x) => x.serviceIds.includes(serviceId)),
    [employees, serviceId]
  );

  const formatTime = (instant: string) =>
    new Intl.DateTimeFormat("es-ES", {
      timeZone: business.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(instant));

  const formatDateTime = (instant: string) =>
    new Intl.DateTimeFormat("es-ES", {
      timeZone: business.timezone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(instant));

  const loadSlots = async () => {
    setMessage("");
    setConfirmedBookingId(null);
    const response = await fetch(
      `/api/public/slots?businessSlug=${business.slug}&serviceId=${serviceId}&employeeId=${employeeId}&date=${date}`
    );
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error);
    } else {
      setSlot("");
      setSlots(json.slots);
      setMessage(
        json.slots.length ? "Selecciona un horario" : "No hay horarios disponibles ese día"
      );
    }
  };

  const submit = async () => {
    setMessage("");
    setConfirmedBookingId(null);
    const response = await fetch("/api/public/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessSlug: business.slug,
        serviceId,
        employeeId,
        startAt: slot,
        ...form,
      }),
    });
    const json = await response.json();
    if (response.ok) {
      setMessage(`Reserva confirmada para ${formatDateTime(json.startAt)}`);
      setConfirmedBookingId(json.id);
      setSlots(slots.filter((x) => x.startAt !== slot));
    } else {
      setMessage(json.error);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Reserva tu turno</h2>

      <label className="block text-sm font-medium">
        Servicio
        <select
          className="mt-1 w-full rounded-lg border p-3"
          value={serviceId}
          onChange={(e) => {
            setServiceId(e.target.value);
            setSlots([]);
          }}
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.durationMinutes} min{s.price ? ` · €${s.price}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Profesional
        <select
          className="mt-1 w-full rounded-lg border p-3"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        >
          <option value="">Selecciona un profesional</option>
          {availableEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Fecha
        <input
          className="mt-1 w-full rounded-lg border p-3"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <button
        className="rounded-lg bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-50"
        disabled={!employeeId || !date}
        onClick={loadSlots}
      >
        Buscar horarios
      </button>

      {slots.length ? (
        <label className="block text-sm font-medium">
          Horario
          <select
            className="mt-1 w-full rounded-lg border p-3"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          >
            <option value="">Selecciona un horario</option>
            {slots.map((s) => (
              <option key={s.startAt} value={s.startAt}>
                {formatTime(s.startAt)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="rounded-lg border p-3"
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="rounded-lg border p-3"
          placeholder="Teléfono"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="rounded-lg border p-3 sm:col-span-2"
          placeholder="Email opcional"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>

      <button
        className="w-full rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
        disabled={!slot || !form.name || !form.phone || !selected}
        onClick={submit}
      >
        Confirmar reserva
      </button>

      {message ? (
        <div className="rounded-lg bg-slate-100 p-4 text-sm space-y-2">
          <p className="font-medium text-slate-800">{message}</p>
          {confirmedBookingId && (
            <p>
              <Link
                href={`/b/${business.slug}/reserva/${confirmedBookingId}`}
                className="inline-flex items-center text-teal-700 font-semibold hover:underline"
              >
                Ver o gestionar mi reserva →
              </Link>
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

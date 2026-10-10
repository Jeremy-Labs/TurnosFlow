import { AppointmentStatus as AppointmentStatusEnum } from "@prisma/client";
import { AppointmentStatus } from "@/components/appointment-status";
import { formatBusinessTime } from "@/lib/domain/availability";

export interface AgendaAppointmentItem {
  id: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatusEnum;
  notes?: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price: unknown;
  };
  employee: {
    id: string;
    name: string;
  };
}

interface AgendaTableProps {
  appointments: AgendaAppointmentItem[];
  timezone: string;
}

export function AgendaTable({ appointments, timezone }: AgendaTableProps) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-base font-medium text-slate-700">
          No hay turnos registrados para esta fecha o filtros seleccionados
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Probá seleccionando otra fecha o cambiando los filtros de profesional, servicio o estado.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800">
          Turnos del día ({appointments.length})
        </h2>
      </div>

      <div className="divide-y divide-slate-100">
        {appointments.map((appointment) => {
          const startTime = formatBusinessTime(appointment.startAt, timezone);
          const endTime = formatBusinessTime(appointment.endAt, timezone);
          const priceValue = appointment.service.price ? Number(appointment.service.price) : null;
          const formattedPrice = priceValue !== null ? `$${priceValue}` : null;

          return (
            <div
              key={appointment.id}
              data-testid="appointment-row"
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">
                    {startTime} - {endTime}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {appointment.customer.name}
                  </span>
                </div>

                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{appointment.service.name}</span>
                  <span className="text-slate-400"> · </span>
                  <span>{appointment.service.durationMinutes} min</span>
                  {formattedPrice && (
                    <>
                      <span className="text-slate-400"> · </span>
                      <span>{formattedPrice}</span>
                    </>
                  )}
                  <span className="text-slate-400"> · </span>
                  <span className="text-slate-700 font-medium">Profesional: {appointment.employee.name}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
                  <span>Tel: {appointment.customer.phone}</span>
                  {appointment.customer.email && <span>Email: {appointment.customer.email}</span>}
                  {appointment.notes && <span className="italic">Nota: &quot;{appointment.notes}&quot;</span>}
                </div>
              </div>

              <div className="flex items-center sm:self-center">
                <AppointmentStatus id={appointment.id} status={appointment.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import Link from "next/link";

interface FilterOption {
  id: string;
  name: string;
}

interface AgendaFiltersProps {
  businessSlug: string;
  currentDate: string;
  currentEmployeeId?: string;
  currentServiceId?: string;
  currentStatus?: string;
  employees: FilterOption[];
  services: FilterOption[];
}

export function AgendaFilters({
  businessSlug,
  currentDate,
  currentEmployeeId = "",
  currentServiceId = "",
  currentStatus = "",
  employees,
  services,
}: AgendaFiltersProps) {
  return (
    <form
      method="GET"
      action={`/dashboard/${businessSlug}/agenda`}
      className="rounded-xl bg-white p-5 shadow-sm"
      aria-label="Filtros de agenda"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="filter-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Fecha
          </label>
          <input
            id="filter-date"
            name="date"
            type="date"
            defaultValue={currentDate}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            required
          />
        </div>

        <div>
          <label htmlFor="filter-employee" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Profesional
          </label>
          <select
            id="filter-employee"
            name="employeeId"
            defaultValue={currentEmployeeId || "ALL"}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            <option value="ALL">Todos los profesionales</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-service" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Servicio
          </label>
          <select
            id="filter-service"
            name="serviceId"
            defaultValue={currentServiceId || "ALL"}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            <option value="ALL">Todos los servicios</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Estado
          </label>
          <select
            id="filter-status"
            name="status"
            defaultValue={currentStatus || "ALL"}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="NO_SHOW">NO_SHOW</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <Link
          href={`/dashboard/${businessSlug}/agenda`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Limpiar filtros
        </Link>
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          Filtrar turnos
        </button>
      </div>
    </form>
  );
}

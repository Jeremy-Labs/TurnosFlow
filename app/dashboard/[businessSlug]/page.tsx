import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppointmentStatus } from "@/components/appointment-status";
import { LogoutButton } from "@/components/logout-button";
import { getBusinessOperationalMetrics } from "@/lib/admin-metrics";
import {
  AuthenticationRequiredError,
  BusinessMembershipRequiredError,
  requireBusinessMembership,
  requireUser,
} from "@/lib/authorization";
import { formatBusinessDateTime } from "@/lib/domain/availability";
import { prisma } from "@/lib/prisma";

export default async function BusinessDashboard({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  try {
    const { businessSlug } = await params;
    const user = await requireUser();
    const membership = await requireBusinessMembership(user.id, businessSlug);

    const business = await prisma.business.findUniqueOrThrow({
      where: { id: membership.businessId },
    });

    const metrics = await getBusinessOperationalMetrics(
      business.id,
      business.timezone
    );

    return (
      <main className="min-h-screen bg-slate-50">
        <nav className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-bold text-teal-700">TurnosFlow</span>
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="text-teal-700 font-semibold border-b-2 border-teal-700 pb-1">
                Panel general
              </span>
              <Link
                href={`/dashboard/${business.slug}/agenda`}
                className="text-slate-600 transition hover:text-slate-900"
              >
                Agenda
              </Link>
              <Link
                href={`/dashboard/${business.slug}/clientes`}
                className="text-slate-600 transition hover:text-slate-900"
              >
                Clientes
              </Link>
              <Link
                href={`/dashboard/${business.slug}/configuracion`}
                className="text-slate-600 transition hover:text-slate-900"
              >
                Configuración
              </Link>
            </div>
          </div>
          <LogoutButton />
        </nav>

        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Panel del negocio · {membership.role}
              </p>
              <h1 className="text-3xl font-bold text-slate-900">{business.name}</h1>
              <p className="mt-1 text-sm text-slate-500">
                Zona horaria: {business.timezone}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
                href={`/dashboard/${business.slug}/agenda`}
              >
                Ver agenda completa
              </Link>
              <Link
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
                href={`/b/${business.slug}`}
              >
                Ver página pública
              </Link>
            </div>
          </div>

          {/* Fila principal de KPIs */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div
              data-testid="kpi-today"
              className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Turnos de hoy</p>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                  {metrics.todayDate}
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {metrics.todayAppointmentsCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Turnos programados para la jornada de hoy
              </p>
            </div>

            <div
              data-testid="kpi-week"
              className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Esta semana</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-mono">
                  {metrics.weekStart} al {metrics.weekEnd}
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {metrics.weekAppointmentsCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Total de turnos de la semana local en curso
              </p>
            </div>

            <div
              data-testid="kpi-customers"
              className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Clientes</p>
                <Link
                  href={`/dashboard/${business.slug}/clientes`}
                  className="text-xs font-medium text-teal-700 hover:underline"
                >
                  Ver clientes →
                </Link>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {metrics.totalCustomersCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Clientes registrados en el negocio
              </p>
            </div>
          </div>

          {/* Fila secundaria de estados */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div
              data-testid="kpi-status-confirmed"
              className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Confirmados
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">
                {metrics.confirmedCount}
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">Listos para atender</p>
            </div>

            <div
              data-testid="kpi-status-completed"
              className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                Completados
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-900">
                {metrics.completedCount}
              </p>
              <p className="mt-0.5 text-xs text-blue-700">Servicios brindados</p>
            </div>

            <div
              data-testid="kpi-status-cancelled"
              className="rounded-xl border border-red-200 bg-red-50/70 p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-red-800">
                Cancelaciones
              </p>
              <p className="mt-2 text-2xl font-bold text-red-900">
                {metrics.cancelledCount}
              </p>
              <p className="mt-0.5 text-xs text-red-700">Turnos cancelados</p>
            </div>

            <div
              data-testid="kpi-status-noshow"
              className="rounded-xl border border-slate-200 bg-slate-100/80 p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                No-shows
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {metrics.noShowCount}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">Sin asistencia</p>
            </div>
          </div>

          {/* Resumen de recursos activos */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-5 py-3 text-xs text-slate-600 shadow-sm">
            <span className="font-medium text-slate-700">
              Recursos del negocio:
            </span>
            <div className="flex items-center gap-4">
              <span>
                <strong>{metrics.serviceCount}</strong> servicios activos
              </span>
              <span>·</span>
              <span>
                <strong>{metrics.employeeCount}</strong> profesionales disponibles
              </span>
            </div>
          </div>

          {/* Sección de próximos turnos inmediatos */}
          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Próximos turnos inmediatos
                </h2>
                <p className="text-xs text-slate-500">
                  Turnos pendientes o confirmados más próximos
                </p>
              </div>
              <Link
                href={`/dashboard/${business.slug}/agenda`}
                className="text-sm font-medium text-teal-700 hover:underline"
              >
                Ver agenda completa →
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {metrics.upcomingAppointments.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No hay turnos inmediatos programados
                </div>
              ) : (
                metrics.upcomingAppointments.map((appointment) => (
                  <div
                    data-testid="upcoming-appointment-row"
                    className="flex flex-wrap items-center justify-between gap-3 p-5"
                    key={appointment.id}
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {appointment.customer.name} · {appointment.service.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {appointment.employee.name} ·{" "}
                        {formatBusinessDateTime(
                          appointment.startAt,
                          business.timezone
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        Tel: {appointment.customer.phone} · Duración:{" "}
                        {appointment.service.durationMinutes} min
                      </p>
                    </div>
                    <AppointmentStatus
                      id={appointment.id}
                      status={appointment.status}
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/login");
    if (error instanceof BusinessMembershipRequiredError) notFound();
    throw error;
  }
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AgendaFilters } from "@/components/agenda-filters";
import { AgendaTable } from "@/components/agenda-table";
import { LogoutButton } from "@/components/logout-button";
import {
  getAdminAgendaAppointments,
  getAdminAgendaFilterOptions,
  sanitizeAgendaFilters,
} from "@/lib/admin-appointments";
import {
  AuthenticationRequiredError,
  BusinessMembershipRequiredError,
  requireBusinessMembership,
  requireUser,
} from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export default async function AgendaPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    const { businessSlug } = await params;
    const rawSearchParams = await searchParams;

    const user = await requireUser();
    const membership = await requireBusinessMembership(user.id, businessSlug);

    const business = await prisma.business.findUniqueOrThrow({
      where: { id: membership.businessId },
    });

    const parsedParams = {
      date: typeof rawSearchParams.date === "string" ? rawSearchParams.date : undefined,
      employeeId: typeof rawSearchParams.employeeId === "string" ? rawSearchParams.employeeId : undefined,
      serviceId: typeof rawSearchParams.serviceId === "string" ? rawSearchParams.serviceId : undefined,
      status: typeof rawSearchParams.status === "string" ? rawSearchParams.status : undefined,
    };

    const filters = sanitizeAgendaFilters(parsedParams, business.timezone);

    const [appointments, filterOptions] = await Promise.all([
      getAdminAgendaAppointments(business.id, filters, business.timezone),
      getAdminAgendaFilterOptions(business.id),
    ]);

    return (
      <main className="min-h-screen bg-slate-50">
        <nav className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-bold text-teal-700">TurnosFlow</span>
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link
                href={`/dashboard/${business.slug}`}
                className="text-slate-600 transition hover:text-slate-900"
              >
                Panel general
              </Link>
              <span className="text-teal-700 font-semibold border-b-2 border-teal-700 pb-1">
                Agenda
              </span>
            </div>
          </div>
          <LogoutButton />
        </nav>

        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                {business.name} · {membership.role}
              </p>
              <h1 className="text-3xl font-bold text-slate-900">Agenda de turnos</h1>
              <p className="mt-1 text-sm text-slate-500">
                Zona horaria del negocio: {business.timezone}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/${business.slug}`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ← Volver al panel
              </Link>
              <Link
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
                href={`/b/${business.slug}`}
              >
                Página pública
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <AgendaFilters
              businessSlug={business.slug}
              currentDate={filters.date}
              currentEmployeeId={filters.employeeId}
              currentServiceId={filters.serviceId}
              currentStatus={filters.status}
              employees={filterOptions.employees}
              services={filterOptions.services}
            />

            <AgendaTable
              appointments={appointments}
              timezone={business.timezone}
            />
          </div>
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/login");
    if (error instanceof BusinessMembershipRequiredError) notFound();
    throw error;
  }
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { getBusinessCustomers } from "@/lib/admin-customers";
import {
  AuthenticationRequiredError,
  BusinessMembershipRequiredError,
  requireBusinessMembership,
  requireUser,
} from "@/lib/authorization";
import { formatBusinessDateTime } from "@/lib/domain/availability";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    const { businessSlug } = await params;
    const rawSearchParams = await searchParams;
    const searchQuery =
      typeof rawSearchParams.q === "string" ? rawSearchParams.q : undefined;

    const user = await requireUser();
    const membership = await requireBusinessMembership(user.id, businessSlug);

    const business = await prisma.business.findUniqueOrThrow({
      where: { id: membership.businessId },
    });

    const customers = await getBusinessCustomers(business.id, searchQuery);

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
              <Link
                href={`/dashboard/${business.slug}/agenda`}
                className="text-slate-600 transition hover:text-slate-900"
              >
                Agenda
              </Link>
              <span className="text-teal-700 font-semibold border-b-2 border-teal-700 pb-1">
                Clientes
              </span>
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
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                {business.name} · {membership.role}
              </p>
              <h1 className="text-3xl font-bold text-slate-900">Gestión de Clientes</h1>
              <p className="mt-1 text-sm text-slate-500">
                Directorio e historial de reservas por cliente
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
                href={`/dashboard/${business.slug}/agenda`}
              >
                Ver agenda
              </Link>
            </div>
          </div>

          {/* Formulario de búsqueda */}
          <form
            method="GET"
            action={`/dashboard/${business.slug}/clientes`}
            className="mb-6 flex gap-3 rounded-xl bg-white p-4 shadow-sm"
            aria-label="Buscar clientes"
          >
            <input
              type="text"
              name="q"
              defaultValue={searchQuery ?? ""}
              placeholder="Buscar por nombre, teléfono o email..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
            >
              Buscar
            </button>
            {searchQuery && (
              <Link
                href={`/dashboard/${business.slug}/clientes`}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Limpiar
              </Link>
            )}
          </form>

          {/* Listado de clientes */}
          {customers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-base font-medium text-slate-700">
                {searchQuery
                  ? `No se encontraron clientes para la búsqueda "${searchQuery}"`
                  : "No hay clientes registrados en este negocio"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Los clientes se registran automáticamente cuando realizan reservas online o en agenda.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <h2 className="font-semibold text-slate-800">
                  Clientes registrados ({customers.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {customers.map((customer) => {
                  const lastAppointment = customer.appointments[0]?.startAt;
                  return (
                    <div
                      key={customer.id}
                      data-testid="customer-row"
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/dashboard/${business.slug}/clientes/${customer.id}`}
                            className="text-base font-semibold text-slate-900 transition hover:text-teal-700 hover:underline"
                          >
                            {customer.name}
                          </Link>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {customer._count.appointments} {customer._count.appointments === 1 ? "turno" : "turnos"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
                          <span>Tel: {customer.phone}</span>
                          {customer.email && <span>Email: {customer.email}</span>}
                        </div>
                        <div className="text-xs text-slate-500">
                          Último turno:{" "}
                          {lastAppointment ? (
                            <span className="font-medium text-slate-700">
                              {formatBusinessDateTime(lastAppointment, business.timezone)}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">Sin turnos previos</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center sm:self-center">
                        <Link
                          href={`/dashboard/${business.slug}/clientes/${customer.id}`}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Ver historial / detalle →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/login");
    if (error instanceof BusinessMembershipRequiredError) notFound();
    throw error;
  }
}

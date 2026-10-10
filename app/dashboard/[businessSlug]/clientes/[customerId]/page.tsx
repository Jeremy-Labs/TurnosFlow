import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppointmentStatus } from "@/components/appointment-status";
import { LogoutButton } from "@/components/logout-button";
import { CustomerNotFoundError, getCustomerDetails } from "@/lib/admin-customers";
import {
  AuthenticationRequiredError,
  BusinessMembershipRequiredError,
  requireBusinessMembership,
  requireUser,
} from "@/lib/authorization";
import { formatBusinessDateTime } from "@/lib/domain/availability";
import { prisma } from "@/lib/prisma";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ businessSlug: string; customerId: string }>;
}) {
  try {
    const { businessSlug, customerId } = await params;

    const user = await requireUser();
    const membership = await requireBusinessMembership(user.id, businessSlug);

    const business = await prisma.business.findUniqueOrThrow({
      where: { id: membership.businessId },
    });

    let customer;
    try {
      customer = await getCustomerDetails(business.id, customerId);
    } catch (err) {
      if (err instanceof CustomerNotFoundError) {
        notFound();
      }
      throw err;
    }

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
              <Link
                href={`/dashboard/${business.slug}/clientes`}
                className="text-teal-700 font-semibold border-b-2 border-teal-700 pb-1"
              >
                Clientes
              </Link>
            </div>
          </div>
          <LogoutButton />
        </nav>

        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                {business.name} · Detalle del cliente
              </p>
              <h1 className="text-3xl font-bold text-slate-900">{customer.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/${business.slug}/clientes`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ← Volver a clientes
              </Link>
              <Link
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
                href={`/dashboard/${business.slug}/agenda`}
              >
                Ver agenda
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Ficha de datos del cliente */}
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Información de contacto
                </h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <span className="block text-xs font-medium text-slate-400">Teléfono</span>
                    <span className="text-slate-800">{customer.phone}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-400">Email</span>
                    <span className="text-slate-800">
                      {customer.email ?? <span className="italic text-slate-400">No especificado</span>}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-400">Total de turnos</span>
                    <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                      {customer._count.appointments} {customer._count.appointments === 1 ? "reserva" : "reservas"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-400">Cliente desde</span>
                    <span className="text-slate-600">
                      {formatBusinessDateTime(customer.createdAt, business.timezone)}
                    </span>
                  </div>
                  {customer.notes && (
                    <div className="border-t border-slate-100 pt-3">
                      <span className="block text-xs font-medium text-slate-400">Notas</span>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700">
                        {customer.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Historial de turnos */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="font-semibold text-slate-800">
                    Historial de turnos ({customer.appointments.length})
                  </h2>
                </div>

                {customer.appointments.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Este cliente aún no tiene turnos registrados.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {customer.appointments.map((appointment) => {
                      const formattedDate = formatBusinessDateTime(
                        appointment.startAt,
                        business.timezone
                      );
                      const priceValue = appointment.service.price
                        ? Number(appointment.service.price)
                        : null;

                      return (
                        <div
                          key={appointment.id}
                          data-testid="customer-appointment-row"
                          className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-slate-900">
                              {appointment.service.name}
                            </span>
                            <div className="text-xs text-slate-600">
                              <span>{formattedDate}</span>
                              <span className="text-slate-400"> · </span>
                              <span>{appointment.service.durationMinutes} min</span>
                              {priceValue !== null && (
                                <>
                                  <span className="text-slate-400"> · </span>
                                  <span>${priceValue}</span>
                                </>
                              )}
                              <span className="text-slate-400"> · </span>
                              <span className="font-medium text-slate-700">
                                Profesional: {appointment.employee.name}
                              </span>
                            </div>
                            {appointment.notes && (
                              <p className="text-xs italic text-slate-500">
                                Nota: &quot;{appointment.notes}&quot;
                              </p>
                            )}
                          </div>

                          <div className="flex items-center sm:self-center">
                            <AppointmentStatus
                              id={appointment.id}
                              status={appointment.status}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
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

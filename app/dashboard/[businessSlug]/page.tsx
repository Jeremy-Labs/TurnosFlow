import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppointmentStatus } from "@/components/appointment-status";
import { LogoutButton } from "@/components/logout-button";
import { AuthenticationRequiredError, BusinessMembershipRequiredError, requireBusinessMembership, requireUser } from "@/lib/authorization";
import { formatBusinessDateTime } from "@/lib/domain/availability";
import { prisma } from "@/lib/prisma";

export default async function BusinessDashboard({ params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessSlug } = await params;
    const user = await requireUser();
    const membership = await requireBusinessMembership(user.id, businessSlug);
    const business = await prisma.business.findUniqueOrThrow({ where: { id: membership.businessId }, include: { appointments: { orderBy: { startAt: "asc" }, take: 10, include: { customer: true, employee: true, service: true } } } });
    const [serviceCount, employeeCount] = await Promise.all([prisma.service.count({ where: { businessId: business.id, active: true } }), prisma.employee.count({ where: { businessId: business.id, active: true } })]);
    return (
      <main className="min-h-screen">
        <nav className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-bold text-teal-700">TurnosFlow</span>
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="text-teal-700 font-semibold border-b-2 border-teal-700 pb-1">Panel general</span>
              <Link href={`/dashboard/${business.slug}/agenda`} className="text-slate-600 transition hover:text-slate-900">
                Agenda
              </Link>
              <Link href={`/dashboard/${business.slug}/clientes`} className="text-slate-600 transition hover:text-slate-900">
                Clientes
              </Link>
              <Link href={`/dashboard/${business.slug}/configuracion`} className="text-slate-600 transition hover:text-slate-900">
                Configuración
              </Link>
            </div>
          </div>
          <LogoutButton />
        </nav>
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm text-slate-500">Panel del negocio · {membership.role}</p>
              <h1 className="text-3xl font-bold">{business.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link className="rounded-lg border border-teal-700 px-4 py-2 text-teal-700 hover:bg-teal-50" href={`/dashboard/${business.slug}/agenda`}>
                Ver agenda completa
              </Link>
              <Link className="rounded-lg bg-teal-700 px-4 py-2 text-white" href={`/b/${business.slug}`}>
                Ver página pública
              </Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Próximos turnos</p>
              <p className="mt-2 text-3xl font-bold">{business.appointments.length}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Servicios</p>
              <p className="mt-2 text-3xl font-bold">{serviceCount}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Profesionales</p>
              <p className="mt-2 text-3xl font-bold">{employeeCount}</p>
            </div>
          </div>
          <section className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-semibold">Próximos turnos</h2>
              <Link href={`/dashboard/${business.slug}/agenda`} className="text-sm font-medium text-teal-700 hover:underline">
                Ir a Agenda →
              </Link>
            </div>
            <div className="divide-y">
              {business.appointments.length === 0 ? (
                <div className="p-5 text-center text-sm text-slate-500">No hay turnos registrados</div>
              ) : (
                business.appointments.map((appointment) => (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-5" key={appointment.id}>
                    <div>
                      <p className="font-medium">
                        {appointment.customer.name} · {appointment.service.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {appointment.employee.name} · {formatBusinessDateTime(appointment.startAt, business.timezone)}
                      </p>
                    </div>
                    <AppointmentStatus id={appointment.id} status={appointment.status} />
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

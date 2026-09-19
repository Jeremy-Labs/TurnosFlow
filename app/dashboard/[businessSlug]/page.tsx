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
    return <main className="min-h-screen"><nav className="flex items-center justify-between border-b bg-white px-6 py-4"><span className="font-bold text-teal-700">TurnosFlow</span><LogoutButton /></nav><div className="mx-auto max-w-6xl p-6"><div className="mb-8 flex items-end justify-between"><div><p className="text-sm text-slate-500">Panel del negocio · {membership.role}</p><h1 className="text-3xl font-bold">{business.name}</h1></div><Link className="rounded-lg bg-teal-700 px-4 py-2 text-white" href={`/b/${business.slug}`}>Ver página pública</Link></div><div className="grid gap-4 md:grid-cols-3"><div className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Próximos turnos</p><p className="mt-2 text-3xl font-bold">{business.appointments.length}</p></div><div className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Servicios</p><p className="mt-2 text-3xl font-bold">{serviceCount}</p></div><div className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Profesionales</p><p className="mt-2 text-3xl font-bold">{employeeCount}</p></div></div><section className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm"><div className="border-b p-5"><h2 className="font-semibold">Agenda</h2></div><div className="divide-y">{business.appointments.map((appointment) => <div className="flex flex-wrap items-center justify-between gap-3 p-5" key={appointment.id}><div><p className="font-medium">{appointment.customer.name} · {appointment.service.name}</p><p className="text-sm text-slate-500">{appointment.employee.name} · {formatBusinessDateTime(appointment.startAt, business.timezone)}</p></div><AppointmentStatus id={appointment.id} status={appointment.status} /></div>)}</div></section></div></main>;
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/login");
    if (error instanceof BusinessMembershipRequiredError) notFound();
    throw error;
  }
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppointmentStatus } from "@/components/appointment-status";
import { formatBusinessDateTime } from "@/lib/domain/availability";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const membership = await prisma.membership.findFirst({ where: { user: { email: session.user.email }, business: { slug: "barberia-central" } }, include: { business: { include: { appointments: { orderBy: { startAt: "asc" }, take: 10, include: { customer: true, employee: true, service: true } } } } } });
  const business = membership?.business;
  if (!business) redirect("/login");
  const serviceCount = await prisma.service.count({ where: { businessId: business.id, active: true } });
  const employeeCount = await prisma.employee.count({ where: { businessId: business.id, active: true } });
  return <main className="min-h-screen"><nav className="border-b bg-white px-6 py-4"><span className="font-bold text-teal-700">TurnosFlow</span></nav><div className="mx-auto max-w-6xl p-6"><div className="mb-8 flex items-end justify-between"><div><p className="text-sm text-slate-500">Panel del negocio</p><h1 className="text-3xl font-bold">{business.name}</h1></div><Link className="rounded-lg bg-teal-700 px-4 py-2 text-white" href={`/b/${business.slug}`}>Ver página pública</Link></div><div className="grid gap-4 md:grid-cols-3"><div className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Próximos turnos</p><p className="mt-2 text-3xl font-bold">{business.appointments.length}</p></div><div className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Servicios</p><p className="mt-2 text-3xl font-bold">{serviceCount}</p></div><div className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Profesionales</p><p className="mt-2 text-3xl font-bold">{employeeCount}</p></div></div><section className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm"><div className="border-b p-5"><h2 className="font-semibold">Agenda</h2></div><div className="divide-y">{business.appointments.map((a) => <div className="flex flex-wrap items-center justify-between gap-3 p-5" key={a.id}><div><p className="font-medium">{a.customer.name} · {a.service.name}</p><p className="text-sm text-slate-500">{a.employee.name} · {formatBusinessDateTime(a.startAt, business.timezone)}</p></div><AppointmentStatus id={a.id} status={a.status} /></div>)}</div></section></div></main>;
}

import Link from "next/link";
import { AuthenticationRequiredError, getUserMemberships, requireUser } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function SelectBusinessPage() {
  try {
    const user = await requireUser();
    const memberships = await getUserMemberships(user.id);
    if (memberships.length === 0) redirect("/dashboard");
    if (memberships.length === 1) redirect(`/dashboard/${memberships[0].business.slug}`);
    return <main className="mx-auto min-h-screen max-w-2xl p-6 pt-16"><p className="font-semibold text-teal-700">TurnosFlow</p><h1 className="mt-2 text-3xl font-bold">Seleccioná un negocio</h1><p className="mt-2 text-slate-600">Elegí el panel al que querés acceder.</p><div className="mt-8 space-y-3">{memberships.map(({ business, role }) => <Link key={business.id} className="flex items-center justify-between rounded-xl border bg-white p-5 transition hover:border-teal-600" href={`/dashboard/${business.slug}`}><span className="font-semibold">{business.name}</span><span className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-700">{role}</span></Link>)}</div></main>;
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/login");
    throw error;
  }
}

import { getDashboardDestination, getUserMemberships, requireUser } from "@/lib/authorization";
import { AuthenticationRequiredError } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function DashboardIndex() {
  try {
    const user = await requireUser();
    const memberships = await getUserMemberships(user.id);
    const destination = getDashboardDestination(memberships);
    if (!destination) return <main className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-bold">Todavía no pertenecés a ningún negocio</h1><p className="mt-3 text-slate-600">Cuando un administrador te invite, vas a poder acceder a su panel desde aquí.</p></main>;
    redirect(destination);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/login");
    throw error;
  }
}

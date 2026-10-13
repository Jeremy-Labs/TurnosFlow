import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BusinessSettingsForm } from "@/components/business-settings-form";
import { LogoutButton } from "@/components/logout-button";
import { getBusinessSettings } from "@/lib/admin-business-settings";
import {
  AuthenticationRequiredError,
  BusinessMembershipRequiredError,
  requireBusinessMembership,
  requireUser,
} from "@/lib/authorization";
import { canManageBusiness } from "@/lib/permissions";

export default async function BusinessSettingsPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  try {
    const { businessSlug } = await params;
    const user = await requireUser();
    const membership = await requireBusinessMembership(user.id, businessSlug);

    const business = await getBusinessSettings(membership.businessId);
    const isManager = canManageBusiness(membership.role);

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
                className="text-slate-600 transition hover:text-slate-900"
              >
                Clientes
              </Link>
              <span className="text-teal-700 font-semibold border-b-2 border-teal-700 pb-1">
                Configuración
              </span>
            </div>
          </div>
          <LogoutButton />
        </nav>

        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                {business.name} · {membership.role}
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                Configuración del Negocio
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Gestiona la información pública, canales de contacto y zona horaria
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

          <BusinessSettingsForm
            business={business}
            role={membership.role}
            isManager={isManager}
          />
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/login");
    if (error instanceof BusinessMembershipRequiredError) notFound();
    throw error;
  }
}

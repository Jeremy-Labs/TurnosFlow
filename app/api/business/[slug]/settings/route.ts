import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  BusinessSettingsForbiddenError,
  BusinessSlugConflictError,
  updateBusinessSettings,
} from "@/lib/admin-business-settings";
import {
  AuthenticationRequiredError,
  BusinessMembershipRequiredError,
  requireBusinessMembership,
  requireUser,
} from "@/lib/authorization";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireUser();
    const { slug } = await params;
    const membership = await requireBusinessMembership(user.id, slug);

    const body = await request.json();
    const updated = await updateBusinessSettings(
      membership.businessId,
      membership.role,
      body
    );

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (error instanceof BusinessMembershipRequiredError) {
      return NextResponse.json(
        { error: "No perteneces a este negocio" },
        { status: 403 }
      );
    }
    if (error instanceof BusinessSettingsForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof BusinessSlugConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0]?.message ?? "Datos de configuración inválidos";
      return NextResponse.json({ error: firstIssue, details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 400 });
  }
}

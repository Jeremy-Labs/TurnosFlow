import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthenticationRequiredError, requireUser } from "@/lib/authorization";
import { PrivateResourceNotFoundError, updateAppointmentStatusForMember } from "@/lib/private-appointments";

const statusSchema = z.object({ status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { status } = statusSchema.parse(await request.json());
    return NextResponse.json(await updateAppointmentStatusForMember(user.id, id, status));
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (error instanceof PrivateResourceNotFoundError) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
}

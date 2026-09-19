import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrivateResourceNotFoundError, updateAppointmentStatusForMember } from "@/lib/private-appointments";
import { z } from "zod";

const statusSchema = z.object({ status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const { status } = statusSchema.parse(await request.json());
    return NextResponse.json(await updateAppointmentStatusForMember(session.user.email, id, status));
  } catch (error) {
    if (error instanceof PrivateResourceNotFoundError) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
}

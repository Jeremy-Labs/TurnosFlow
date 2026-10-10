import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  cancelPublicBooking,
  getPublicBooking,
  PublicBookingConflictError,
  PublicBookingLifecycleError,
  PublicBookingNotFoundError,
  reschedulePublicBooking,
} from "@/lib/public-manage-booking";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cancel"),
  }),
  z.object({
    action: z.literal("reschedule"),
    startAt: z.coerce.date(),
  }),
]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointment = await getPublicBooking(id);
    return NextResponse.json(appointment);
  } catch (error) {
    if (error instanceof PublicBookingNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al obtener la reserva" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = actionSchema.parse(body);

    if (payload.action === "cancel") {
      const updated = await cancelPublicBooking(id);
      return NextResponse.json(updated);
    }

    if (payload.action === "reschedule") {
      const updated = await reschedulePublicBooking(id, payload.startAt);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos de solicitud inválidos" }, { status: 400 });
    }
    if (error instanceof PublicBookingNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof PublicBookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof PublicBookingLifecycleError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error inesperado" },
      { status: 400 }
    );
  }
}

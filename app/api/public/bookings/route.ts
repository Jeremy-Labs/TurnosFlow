import { NextRequest, NextResponse } from "next/server";
import { createPublicBooking } from "@/lib/booking";
export async function POST(request: NextRequest) { try { const appointment = await createPublicBooking(await request.json()); return NextResponse.json(appointment, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear la reserva" }, { status: 400 }); } }

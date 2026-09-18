import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const statusSchema = z.object({ status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]) });
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const session = await auth(); if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 }); try { const { id } = await params; const input = statusSchema.parse(await request.json()); const appointment = await prisma.appointment.findFirst({ where: { id, business: { memberships: { some: { user: { email: session.user.email } } } } } }); if (!appointment) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 }); return NextResponse.json(await prisma.appointment.update({ where: { id }, data: { status: input.status } })); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Solicitud inválida" }, { status: 400 }); } }

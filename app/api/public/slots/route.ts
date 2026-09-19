import { NextRequest, NextResponse } from "next/server";
import { getPublicAvailability } from "@/lib/availability-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams;
    const date = query.get("date");
    if (!date) return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });
    const availability = await getPublicAvailability(prisma, { businessSlug: query.get("businessSlug") ?? "", serviceId: query.get("serviceId") ?? "", employeeId: query.get("employeeId") ?? "", date });
    return NextResponse.json({ slots: availability.slots, timezone: availability.business.timezone });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 400 });
  }
}

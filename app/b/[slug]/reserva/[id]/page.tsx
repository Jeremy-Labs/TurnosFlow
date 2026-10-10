import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicBookingManager } from "@/components/public-booking-manager";
import { getPublicBooking, PublicBookingNotFoundError } from "@/lib/public-manage-booking";

export default async function ManagePublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  let appointment;
  try {
    appointment = await getPublicBooking(id);
  } catch (error) {
    if (error instanceof PublicBookingNotFoundError) {
      notFound();
    }
    throw error;
  }

  // Verificar que la reserva pertenezca al slug de la URL
  if (appointment.business.slug !== slug) {
    notFound();
  }

  const serializableAppointment = {
    ...appointment,
    startAt: appointment.startAt.toISOString(),
    endAt: appointment.endAt.toISOString(),
    service: {
      ...appointment.service,
      price: appointment.service.price ? Number(appointment.service.price) : null,
    },
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between">
          <Link
            href={`/b/${slug}`}
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            ← Volver a la página de {appointment.business.name}
          </Link>
          <span className="text-xs text-slate-400">TurnosFlow</span>
        </header>

        <PublicBookingManager initialAppointment={serializableAppointment} />
      </div>
    </main>
  );
}

import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "TurnosFlow", description: "Gestión de turnos para negocios" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}

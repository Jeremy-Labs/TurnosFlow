"use client";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => signOut({ callbackUrl: "/login" })}>Cerrar sesión</button>;
}

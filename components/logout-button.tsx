import { signOut } from "@/auth";

export function LogoutButton() {
  async function logout() {
    "use server";

    await signOut({ redirectTo: "/login" });
  }

  return (
    <form action={logout}>
      <button className="rounded-lg border px-3 py-2 text-sm" type="submit">
        Cerrar sesión
      </button>
    </form>
  );
}

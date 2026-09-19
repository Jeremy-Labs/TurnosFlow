import { expect, test } from "@playwright/test";

test("a customer completes the critical public booking flow", async ({ page }) => {
  await page.goto("/b/barberia-central");
  await page.getByLabel("Servicio").selectOption({ label: /Corte/ });
  await page.getByLabel("Profesional").selectOption({ label: "Juan" });
  await page.getByLabel("Fecha").fill("2030-01-07");
  await page.getByRole("button", { name: "Buscar horarios" }).click();
  const schedule = page.getByLabel("Horario");
  await expect(schedule).toBeVisible();
  await schedule.selectOption({ index: 1 });
  await page.getByPlaceholder("Nombre").fill("Cliente E2E");
  await page.getByPlaceholder("Teléfono").fill("+34 600 000 001");
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(page.getByText("Reserva confirmada para")).toBeVisible();
});

import { expect, test } from "@playwright/test";

function nextBusinessWeekday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const candidate = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), 12));
  candidate.setUTCDate(candidate.getUTCDate() + 2);
  while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6) candidate.setUTCDate(candidate.getUTCDate() + 1);
  return candidate.toISOString().slice(0, 10);
}

test("a customer completes the critical public booking flow", async ({ page }) => {
  await page.goto("/b/barberia-central");
  await page.getByLabel("Servicio").selectOption("demo-corte");
  await page.getByLabel("Profesional").selectOption("demo-juan");
  await page.getByLabel("Fecha").fill(nextBusinessWeekday());
  await page.getByRole("button", { name: "Buscar horarios" }).click();
  const schedule = page.getByLabel("Horario");
  await expect(schedule).toBeVisible();
  const slots = await schedule.locator("option").evaluateAll((options) => options.slice(1).map((option) => (option as HTMLOptionElement).value));
  expect(slots.length).toBeGreaterThan(0);
  await schedule.selectOption(slots[0]);
  await page.getByPlaceholder("Nombre").fill("Cliente E2E");
  await page.getByPlaceholder("Teléfono").fill("+34 600 000 001");
  await page.getByPlaceholder("Email opcional").fill("cliente-e2e@example.test");
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(page.getByText("Reserva confirmada para")).toBeVisible();
});

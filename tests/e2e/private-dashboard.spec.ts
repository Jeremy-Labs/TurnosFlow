import { expect, test } from "@playwright/test";

test("a user selects a business and logout protects the dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("demo@turnosflow.local");
  await page.getByPlaceholder("Contraseña").fill("demo");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard\/seleccionar-negocio$/);
  await expect(page.getByText("Barbería Central")).toBeVisible();
  await expect(page.getByText("Centro Estético Demo")).toBeVisible();
  await page.getByRole("link", { name: /Barbería Central/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/barberia-central$/);
  await expect(page.getByRole("heading", { name: "Barbería Central" })).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("an authenticated user views and filters the admin agenda", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("demo@turnosflow.local");
  await page.getByPlaceholder("Contraseña").fill("demo");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard\/seleccionar-negocio$/);

  await page.getByRole("link", { name: /Barbería Central/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/barberia-central$/);

  // Navigate to Agenda
  await page.getByRole("link", { name: "Ver agenda completa" }).click();
  await expect(page).toHaveURL(/\/dashboard\/barberia-central\/agenda$/);
  await expect(page.getByRole("heading", { name: "Agenda de turnos" })).toBeVisible();

  // Verify filter controls exist
  await expect(page.getByLabel("Fecha")).toBeVisible();
  await expect(page.getByLabel("Profesional")).toBeVisible();
  await expect(page.getByLabel("Servicio")).toBeVisible();
  await expect(page.getByLabel("Estado")).toBeVisible();

  // Filter by demo seed date (2030-01-07)
  await page.getByLabel("Fecha").fill("2030-01-07");
  await page.getByRole("button", { name: "Filtrar turnos" }).click();

  await expect(page).toHaveURL(/date=2030-01-07/);
  await expect(page.getByText("Lucía García")).toBeVisible();
  const appointmentItem = page.locator("div").filter({ hasText: "Lucía García" }).first();
  await expect(appointmentItem.getByText(/Corte/)).toBeVisible();
  await expect(page.getByText(/Profesional: Juan/)).toBeVisible();
  await expect(page.getByText("10:00 - 10:30")).toBeVisible();

  // Filter by a professional that has no appointments on that date (María)
  await page.getByLabel("Profesional").selectOption("demo-maria");
  await page.getByRole("button", { name: "Filtrar turnos" }).click();

  await expect(page.getByText("No hay turnos registrados para esta fecha o filtros seleccionados")).toBeVisible();

  // Reset or clear filters
  await page.getByRole("link", { name: "Limpiar filtros" }).click();
  await expect(page).toHaveURL(/\/dashboard\/barberia-central\/agenda$/);
});


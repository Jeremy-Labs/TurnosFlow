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

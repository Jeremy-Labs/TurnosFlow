import { test, expect } from "@playwright/test";
test("public booking page exposes the reservation flow", async ({ page }) => { await page.goto("/b/barberia-central"); await expect(page.getByText("Reserva tu turno")).toBeVisible(); await expect(page.getByText("Servicio")).toBeVisible(); });

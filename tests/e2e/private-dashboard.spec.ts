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
  await page.getByRole("link", { name: "Ver agenda completa", exact: true }).click();
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
  const appointmentRow = page.getByTestId("appointment-row").filter({ hasText: "Lucía García" });
  await expect(appointmentRow).toBeVisible();
  await expect(appointmentRow.getByText(/Corte/)).toBeVisible();
  await expect(appointmentRow.getByText(/Profesional: Juan/)).toBeVisible();
  await expect(appointmentRow.getByText("10:00 - 10:30")).toBeVisible();

  // Filter by a professional that has no appointments on that date (María)
  await page.getByLabel("Profesional").selectOption("demo-maria");
  await page.getByRole("button", { name: "Filtrar turnos" }).click();

  await expect(page.getByText("No hay turnos registrados para esta fecha o filtros seleccionados")).toBeVisible();

  // Reset or clear filters
  await page.getByRole("link", { name: "Limpiar filtros" }).click();
  await expect(page).toHaveURL(/\/dashboard\/barberia-central\/agenda$/);
});

test("an authenticated user views customers list and appointment history", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("demo@turnosflow.local");
  await page.getByPlaceholder("Contraseña").fill("demo");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard\/seleccionar-negocio$/);

  await page.getByRole("link", { name: /Barbería Central/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/barberia-central$/);

  // Navigate to Clientes
  await page.getByRole("link", { name: "Clientes" }).first().click();
  await expect(page).toHaveURL(/\/dashboard\/barberia-central\/clientes$/);
  await expect(page.getByRole("heading", { name: "Gestión de Clientes" })).toBeVisible();

  // Search or locate demo customer Lucía García
  await expect(page.getByText("Lucía García")).toBeVisible();
  const customerRow = page.getByTestId("customer-row").filter({ hasText: "Lucía García" });
  await expect(customerRow).toBeVisible();
  await expect(customerRow.getByText(/\+34 611 222 333/)).toBeVisible();

  // Open customer detail / history
  await customerRow.getByRole("link", { name: "Lucía García" }).click();
  await expect(page).toHaveURL(/\/dashboard\/barberia-central\/clientes\/demo-customer$/);
  await expect(page.getByRole("heading", { name: "Lucía García" })).toBeVisible();
  await expect(page.getByText("Información de contacto")).toBeVisible();
  await expect(page.getByText("Historial de turnos")).toBeVisible();

  // Check appointment history row contains Corte
  const appointmentHistoryRow = page.getByTestId("customer-appointment-row").filter({ hasText: "Corte" });
  await expect(appointmentHistoryRow).toBeVisible();
  await expect(appointmentHistoryRow.getByText(/Profesional: Juan/)).toBeVisible();
});

test("an authenticated user views and updates business settings", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("demo@turnosflow.local");
  await page.getByPlaceholder("Contraseña").fill("demo");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard\/seleccionar-negocio$/);

  await page.getByRole("link", { name: /Barbería Central/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/barberia-central$/);

  // Navigate to Configuración via nav link
  await page.getByRole("link", { name: "Configuración" }).first().click();
  await expect(page).toHaveURL(/\/dashboard\/barberia-central\/configuracion$/);
  await expect(
    page.getByRole("heading", { name: "Configuración del Negocio" })
  ).toBeVisible();

  // Verify fields are loaded with business values
  const nameInput = page.getByLabel("Nombre del negocio *");
  const slugInput = page.getByLabel("Slug (identificador web) *");
  const timezoneInput = page.getByLabel("Zona horaria *");
  const phoneInput = page.getByLabel("Teléfono de contacto");
  const descriptionInput = page.getByLabel("Descripción del negocio");

  await expect(nameInput).toHaveValue("Barbería Central");
  await expect(slugInput).toHaveValue("barberia-central");
  await expect(timezoneInput).toHaveValue("Europe/Madrid");

  // Modify phone and description
  const updatedPhone = "+34 600 999 888";
  const updatedDescription = "Barbería clásica actualizada para pruebas";
  await phoneInput.fill(updatedPhone);
  await descriptionInput.fill(updatedDescription);

  // Submit form
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  // Verify feedback message
  await expect(page.getByTestId("settings-success-message")).toBeVisible();
  await expect(page.getByTestId("settings-success-message")).toHaveText(
    "Configuración guardada correctamente."
  );

  // Reload page to verify persistence
  await page.reload();
  await expect(phoneInput).toHaveValue(updatedPhone);
  await expect(descriptionInput).toHaveValue(updatedDescription);
});

test("an authenticated user views operational metrics on dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("demo@turnosflow.local");
  await page.getByPlaceholder("Contraseña").fill("demo");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard\/seleccionar-negocio$/);

  await page.getByRole("link", { name: /Barbería Central/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/barberia-central$/);
  await expect(page.getByRole("heading", { name: "Barbería Central" })).toBeVisible();

  // Verify primary KPI cards
  await expect(page.getByTestId("kpi-today")).toBeVisible();
  await expect(page.getByText("Turnos de hoy")).toBeVisible();

  await expect(page.getByTestId("kpi-week")).toBeVisible();
  await expect(page.getByText("Esta semana")).toBeVisible();

  await expect(page.getByTestId("kpi-customers")).toBeVisible();
  await expect(page.getByTestId("kpi-customers").getByText("Clientes", { exact: true })).toBeVisible();

  // Verify status cards
  await expect(page.getByTestId("kpi-status-confirmed")).toBeVisible();
  await expect(page.getByTestId("kpi-status-confirmed").getByText("Confirmados")).toBeVisible();

  await expect(page.getByTestId("kpi-status-completed")).toBeVisible();
  await expect(page.getByTestId("kpi-status-completed").getByText("Completados")).toBeVisible();

  await expect(page.getByTestId("kpi-status-cancelled")).toBeVisible();
  await expect(page.getByTestId("kpi-status-cancelled").getByText("Cancelaciones")).toBeVisible();

  await expect(page.getByTestId("kpi-status-noshow")).toBeVisible();
  await expect(page.getByTestId("kpi-status-noshow").getByText("No-shows")).toBeVisible();

  // Verify upcoming appointments section
  await expect(
    page.getByRole("heading", { name: "Próximos turnos inmediatos" })
  ).toBeVisible();
});



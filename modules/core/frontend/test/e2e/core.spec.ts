import { test, expect } from "@playwright/test";

test("is redirected to entities", async ({ page }) => {
  await page.goto("http://localhost:3001/core/authenticate");

  await expect(page).toHaveURL("http://localhost:3001/core/entities");
});

test("shows afghanistan in countries list", async ({ page }) => {
  await page.goto("http://localhost:3001/core/entities");

  const loc = page.getByText("Country");

  await expect(loc).toBeVisible();

  await loc.click({ force: true });

  await expect(page).toHaveURL(
    "http://localhost:3001/core/entities/Grit::Core::Country",
  );

  await expect(page.getByText("afghanistan")).toBeVisible();
});

test("can create a new location and see it in the list", async ({ page }) => {
  await page.goto("http://localhost:3001/core/entities/Grit::Core::Location");

  await page.locator(".grit-toolbar__expanderIcon").click();

  await page.locator("#circle-1new_svg__circle-new").click();

  await expect(page).toHaveURL(
    "http://localhost:3001/core/entities/Grit::Core::Location/new",
  );

  await page.getByPlaceholder("name").fill("test location");

  await page.getByPlaceholder("print address").fill("test print address");

  await page.getByText("none selected").first().click();
  await page.getByText("Andorra").click();

  await page.getByText("none selected").first().click();
  await page.getByText("ADMIN", { exact: true }).click();

  await page.getByText("save").click();

  await expect(page).toHaveURL(/\/core\/entities\/Grit::Core::Location\/\d+$/);

  await page.goto("http://localhost:3001/core/entities/Grit::Core::Location");

  await expect(page.getByText("test location")).toBeVisible();

  await page.getByText("test location").click();

  await page.getByText("delete").click();

  await expect(page).toHaveURL(
    "http://localhost:3001/core/entities/Grit::Core::Location",
  );
});

test("table shows all columns from test entity", async ({ page }) => {
  await page.goto("http://localhost:3001/core/entities/TestEntity");

  await expect(page.getByText("Name", { exact: true })).toBeVisible();
  await expect(page.getByText("another string")).toBeVisible();
  await expect(page.getByText("integer")).toBeVisible();
  await expect(page.getByText("decimal")).toBeVisible();
  await expect(page.getByText("float")).toBeVisible();
  await expect(page.getByText("text")).toBeVisible();
  await expect(page.getByText("Datetime", { exact: true })).toBeVisible();
  await expect(page.getByText("Date", { exact: true })).toBeVisible();
  await expect(page.getByText("boolean")).toBeVisible();
  await expect(
    page.getByText("Grit::Core::User Name", { exact: true }),
  ).toBeVisible();
});

test("form shows all fields from test entity", async ({ page }) => {
  await page.goto("http://localhost:3001/core/entities/TestEntity/new");

  await expect(page.getByText("Name", { exact: true })).toBeVisible();
  await expect(page.getByText("another string")).toBeVisible();
  await expect(page.getByText("integer")).toBeVisible();
  await expect(page.getByText("decimal")).toBeVisible();
  await expect(page.getByText("float")).toBeVisible();
  await expect(page.getByText("text")).toBeVisible();
  await expect(page.getByText("Datetime", { exact: true })).toBeVisible();
  await expect(page.getByText("Date", { exact: true })).toBeVisible();
  await expect(page.getByText("boolean")).toBeVisible();
  await expect(
    page.getByText("Grit::Core::User Name", { exact: true }),
  ).toBeVisible();
});

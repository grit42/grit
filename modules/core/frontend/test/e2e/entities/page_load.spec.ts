import { test, expect } from "@playwright/test";
import { TEST_ENTITY_COLUMNS } from "./test_entity";

const BASE_URL = "http://localhost:3001/app/core/entities/Grit::TestEntity";

test.describe("Generic Entities", () => {
  test("Entity page loads correctly", async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page).toHaveURL(BASE_URL);

    await expect(page.getByText("Test entity")).toBeVisible();

    // Check actions are displayed correctly
    await expect(page.getByRole("button", { name: "New" })).toBeVisible();
    await expect(page.locator("#toolbar-export-action")).toBeVisible();
    await expect(page.locator("#toolbar-import-action")).toBeVisible();

    // Check tabs are displayed correctly
    await expect(
      page.getByRole("tab", { name: "Records", selected: true }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Load sets" })).toBeVisible();

    // Check table is displayed correctly
    await expect(page.getByRole("button", { name: "Filters" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Columns" })).toBeVisible();
    await Promise.all(
      TEST_ENTITY_COLUMNS.filter((c) => !c.default_hidden).map((c) =>
        expect(
          page.getByRole("columnheader", { name: c.display_name, exact: true }),
        ).toBeVisible(),
      ),
    );

    // Check load sets tabs are interactive
    await page.getByRole("tab", { name: "Load sets" }).click();
    await expect(
      page.getByRole("tab", { name: "Load sets", selected: true }),
    ).toBeVisible();

    // Check load sets are displayed correctly
    await expect(
      page.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Origin" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();
  });
});

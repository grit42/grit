import { test, expect } from "@playwright/test";
import { TEST_ENTITY_FIELDS } from "./test_entity";

const BASE_URL = "http://localhost:3001/app/core/entities/Grit::TestEntity";

// Helper to generate unique names
const uniqueName = (prefix: string) => `${prefix} ${Date.now()}`;

test.describe("Generic Entities", () => {
  test("Can create a record and see it in the list", async ({ page }) => {
    const testEntityName = uniqueName("TestEntity");

    // Navigate to vocabularies list
    await page.goto(BASE_URL);
    await expect(page.getByText("Test entity")).toBeVisible();

    // Click New button
    await page.getByRole("button", { name: "New" }).click();
    await expect(page).toHaveURL(`${BASE_URL}/new`);

    // Verify form fields
    await Promise.all(
      TEST_ENTITY_FIELDS.map((c) =>
        expect(
          page.getByText(c.required ? `${c.display_name} *` : c.display_name, {
            exact: true,
          }),
        ).toBeVisible(),
      ),
    );

    // Fill in the form
    await page.getByPlaceholder("Name").fill(testEntityName);

    // Verify Save button appears
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Revert changes" }),
    ).toBeVisible();

    // Save the record
    await page.getByRole("button", { name: "Save" }).click();

    // Verify redirected to records page
    await expect(page).toHaveURL(BASE_URL);
    await expect(
      page.getByRole("cell", { name: testEntityName }),
    ).toBeVisible();

    // Clean up
    await page.getByRole("cell", { name: testEntityName }).click();
    await expect(page).toHaveURL(
      (url) => !!url.href.replace(BASE_URL, "").match(/^\/\d+$/),
    );

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page).toHaveURL(BASE_URL);
  });

  test("Cannot create a record with a duplicate name", async ({ page }) => {
    const testEntityName = "TestEntity42";

    // Create first record
    await page.goto(BASE_URL + "/new");
    await page.getByPlaceholder("Name").fill(testEntityName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Edit Test entity")).toBeVisible();

    // Create second record with a name already used
    await page.goto(BASE_URL + "/new");
    await page.getByPlaceholder("Name").fill(testEntityName);
    await page.getByRole("button", { name: "Save" }).click();

    // Verify error is displayed and save button disabled
    await expect(page.getByText(/already.+taken$/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();

    // Clean up
    await page.goto(BASE_URL);
    await page.getByRole("cell", { name: testEntityName }).click();
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(BASE_URL);
  });
});

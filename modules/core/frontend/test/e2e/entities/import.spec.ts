import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const BASE_URL = "http://localhost:3001/app/core/entities/Grit::TestEntity";
const IMPORT_URL =
  "http://localhost:3001/app/core/load_sets/new?entity=Grit::TestEntity";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);

const TEST_ENTITIES_FILE = path.join(__dirname, "test_entities.csv");

test.describe.configure({ mode: "default" });

test.describe("Generic Entities", () => {
  test("Can import entities", async ({ page }) => {
    // Navigate to the Test entity importer URL
    await page.goto(IMPORT_URL);
    await expect(page.getByText("Upload data")).toBeVisible();

    await page
      .getByRole("textbox", { name: "Name" })
      .fill("First test entity load set");

    // Select 'ADMIN' from the owner dropdown
    await page.getByText("(none selected)").click();
    await page.getByRole("row", { name: "ADMIN" }).click();

    // Verify ADMIN is selected in the Origin field (use locator scoped to avoid matching nav elements)
    await expect(
      page.locator("p").filter({ hasText: /^ADMIN$/ }),
    ).toBeVisible();

    // Click the 'Pick a file' button and upload the Test entities CSV file
    const fileChooserPromise1 = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Pick a file" }).click();
    const fileChooser1 = await fileChooserPromise1;
    await fileChooser1.setFiles(TEST_ENTITIES_FILE);

    // Click the 'Start import' button to begin the first import
    await page.getByRole("button", { name: "Start import" }).click();

    // Configure required field mappings - click on the country mapping field and select 'ADMIN'
    await page
      .locator("label")
      .filter({ hasText: "Use a constant value" })
      .nth(8)
      .click();
    await page.getByText("User(none selected)").click();
    await page.getByRole("row", { name: "Administrator" }).click();

    // Click the 'Validate data set' button
    await page.getByRole("button", { name: "Validate data set" }).click();
    await expect(
      page.getByRole("button", { name: "Confirm import" }),
    ).toBeVisible();

    // Click the 'Confirm import' button to complete the first import
    await page.getByRole("button", { name: "Confirm import" }).click();
    await expect(page.getByText("Import succeeded")).toBeVisible();

    // Verify the import result shows 10 records
    await expect(page.getByText(/10 records/)).toBeVisible();

    // Navigate to Test entity page to verify imported data
    await page.goto(BASE_URL);
    await page.getByText("Test entity").first().waitFor({ state: "visible" });

    // Verify at least one imported Test entity name is visible (first UUID from CSV)
    await expect(
      page.getByText("ffb1a1b0-1ce6-4788-a33b-b6ae40001d68"),
    ).toBeVisible();

    // Navigate to the Test entity importer URL
    await page.goto(IMPORT_URL);
    await expect(page.getByText("Upload data")).toBeVisible();

    await page
      .getByRole("textbox", { name: "Name" })
      .fill("Second test entity load set");

    // Select 'ADMIN' from the owner dropdown
    await page.getByText("(none selected)").click();
    await page.getByRole("row", { name: "ADMIN" }).click();
    // Verify ADMIN is selected in the Origin field (use locator scoped to avoid matching nav elements)
    await expect(
      page.locator("p").filter({ hasText: /^ADMIN$/ }),
    ).toBeVisible();

    // Click the 'Pick a file' button and upload the Test entities CSV file
    const fileChooserPromise2 = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Pick a file" }).click();
    const fileChooser2 = await fileChooserPromise2;
    await fileChooser2.setFiles(TEST_ENTITIES_FILE);

    // Click the 'Start import' button to begin the first import
    await page.getByRole("button", { name: "Start import" }).click();

    // Configure required field mappings - click on the country mapping field and select 'ADMIN'
    await page
      .locator("label")
      .filter({ hasText: "Use a constant value" })
      .nth(8)
      .click();
    await page.getByText("User(none selected)").click();
    await page.getByRole("row", { name: "Administrator" }).click();

    // Click the 'Validate data set' button
    await page.getByRole("button", { name: "Validate data set" }).click();
    await expect(page.getByRole("tab", { name: "Errors" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Warnings" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Errored rows" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ignore errors and confirm import" }),
    ).toBeVisible();

    await expect(
      page.getByText("has already been taken").first(),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Line" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Column" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Value" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Error" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Errored rows" }).click();
    await expect(
      page.getByRole("tabpanel", { name: "Errored rows" }),
    ).toBeVisible();
    await expect(
      page.getByText("ffb1a1b0-1ce6-4788-a33b-b6ae40001d68").first(),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Warnings" }).click();
    await expect(
      page.getByRole("tabpanel", { name: "Warnings" }),
    ).toBeVisible();
    await expect(page.getByText("has an error").first()).toBeVisible();

    await page.getByRole("button", { name: "Cancel import" }).click();

    // Navigate to the Test entity page to find the load set for cleanup
    await page.goto(BASE_URL);
    await page.getByText("Load sets").first().waitFor({ state: "visible" });

    // Click on 'Load sets' to view import history
    await page.getByRole("tab", { name: "Load sets" }).click();

    // Select the first (completed) import load set
    await page
      .getByRole("row")
      .filter({ hasText: "First test entity load set" })
      .first()
      .click();

    // Click 'Undo import' button and confirm the dialog to clean up the first import
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Undo import" }).click();

    // Wait to for redirect to load set creation
    await page
      .getByText("Map columns to properties")
      .first()
      .waitFor({ state: "visible" });

    // Click 'Cancel import' to cancel the undone import
    await page.getByRole("button", { name: "Cancel import" }).click();

    // Wait to for redirect to load set creation
    await page.getByText("Upload data").first().waitFor({ state: "visible" });

    // Navigate to Test entity page to verify data was removed
    await page.goto(BASE_URL);
    await page.getByText("Test entity").first().waitFor({ state: "visible" });

    // Verify the imported test entity names are no longer present
    await expect(
      page.getByText("ffb1a1b0-1ce6-4788-a33b-b6ae40001d68"),
    ).not.toBeVisible();
  });
});

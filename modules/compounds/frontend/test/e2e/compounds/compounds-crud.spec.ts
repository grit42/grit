import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3001/app/compounds";

const uniqueName = (prefix: string) => `${prefix}${Date.now()}`;

test.describe("Compound CRUD operations", () => {
  test("Can create and delete a compound", async ({ page }) => {
    const compoundName = uniqueName("CMPD-");
    const batchName = uniqueName(uniqueName("CMPD-") + "-");
    await page.goto(BASE_URL);

    // Check compounds grid is shown properly
    await expect(
      page.locator("div").filter({ hasText: /^Compounds$/ }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Small molecule" }),
    ).toBeVisible();

    // Create a compound
    await page.getByRole("button", { name: "New" }).click();

    // Set molecule by smiles
    await page.locator(".grit-moleculeInput__molecule").click();
    await page.locator('textarea[name="SMILES"]').fill("C");
    await page.getByRole("button", { name: "Done" }).click();

    await page.getByRole("textbox", { name: "Name" }).fill(compoundName);
    await page.getByText("Origin *").click();
    await page
      .locator("div")
      .filter({ hasText: /^\(none selected\)$/ })
      .first()
      .click();
    await page.getByRole("cell", { name: "ADMIN" }).click();
    await page.getByRole("button", { name: "Save" }).click();

    // check redirect to the compound's details page
    await expect(page).toHaveURL(/\/app\/compounds\/\d+\/details/);
    await expect(
      page.getByRole("tab", { name: "Details", selected: true }),
    ).toBeVisible();

    // check other tabs are displayed
    await expect(page.getByRole("tab", { name: "Batches" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Synonyms" })).toBeVisible();

    // check number input is disabled
    await expect(page.getByRole("textbox", { name: "Number" })).toBeDisabled();

    // check create batch
    await page.getByRole("tab", { name: "Batches" }).click();
    await page.getByRole("button", { name: "New" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(batchName);
    await page.getByText("(none selected)").click();
    await page.getByRole("cell", { name: "ADMIN" }).click();
    await page.getByRole("button", { name: "Save" }).click();

    // check batch is displayed
    await expect(page).toHaveURL(/\/app\/compounds\/\d+\/batches/);
    await expect(page.getByRole("cell", { name: batchName })).toBeVisible();

    // check delete batch
    await page.getByRole("cell", { name: batchName }).click();
    page.waitForEvent("dialog").then((dialog) => {
      expect(
        dialog,
        "Are you sure you want to delete this batch? This action is irreversible",
      );
      dialog.accept();
    });
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(/\/app\/compounds\/\d+\/batches/);
    await expect(page.getByRole("cell", { name: batchName })).toHaveCount(0);

    // check the compound is shown in the grid and can be opened
    await page.goto(BASE_URL);
    await expect(page.getByRole("cell", { name: compoundName })).toBeVisible();
    await page.getByRole("cell", { name: compoundName }).click();

    // check redirect to the compound's details page
    await expect(page).toHaveURL(/\/app\/compounds\/\d+\/details/);
    await expect(
      page.getByRole("tab", { name: "Details", selected: true }),
    ).toBeVisible();

    // clean up
    page.waitForEvent("dialog").then((dialog) => {
      expect(
        dialog,
        "Are you sure you want to delete this Compound? This action is irreversible",
      );
      dialog.accept();
    });
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(BASE_URL);
    await expect(page.getByRole("cell", { name: compoundName })).toHaveCount(0);
  });
});

import { test, expect, Page } from "@playwright/test";
import { fileURLToPath } from "url";
import path from "path";

const BASE_URL = "http://localhost:3001/app";
const IMPORT_URL = `${BASE_URL}/core/load_sets/new?entity=Grit::Compounds::Compound`;
const ORIGINS_NEW_URL = `${BASE_URL}/core/entities/Grit::Core::Origin/new`;
const COMPOUND_PROPERTY_NEW_URL = `${BASE_URL}/core/entities/Grit::Compounds::CompoundProperty/new`;

/**
 * Select an option in a mapping-form combobox by finding the input adjacent to
 * the field label via XPath, typing to filter, then clicking the exact match.
 */
async function selectMappingColumn(
  page: Page,
  fieldLabel: string,
  optionLabel: string,
) {
  // InputLabel renders <label htmlFor={label}> with no matching id on the input,
  // so we navigate: label → parent div.label → parent containerRef div → input
  const input = page.locator(
    `xpath=//label[normalize-space()="${fieldLabel}"]/../..//input[@type="text"]`,
  );
  await input.click();
  await input.fill(optionLabel);
  await page.getByText(optionLabel, { exact: true }).first().click();
}

test.describe("Compound Import", () => {
  test("Can import a compound from an SDF file", async ({ page }) => {
    test.setTimeout(120_000);
    const ts = Date.now();
    const loadSetName = `DrugBank Import ${ts}`;
    const originName = "drugbank";
    const formulaPropertyName = `Formula ${ts}`;
    const formulaSafeName = `formula_${ts}`.slice(0, 30);
    const sdfPath = path.join(
      fileURLToPath(new URL(".", import.meta.url)),
      "../fixtures/DrugbankOneDrug.sdf",
    );

    // --- Setup: create the "drugbank" origin ---
    await page.goto(ORIGINS_NEW_URL);
    await page.getByRole("textbox", { name: "Name" }).fill(originName);
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL(/\/app\/core\/entities\/Grit::Core::Origin\/\d+/);
    const originUrl = page.url();

    // --- Setup: create "Formula" compound property for Small molecule ---
    await page.goto(COMPOUND_PROPERTY_NEW_URL);
    await page
      .getByRole("textbox", { name: "Name", exact: true })
      .fill(formulaPropertyName);
    await page
      .getByRole("textbox", { name: "Safe name", exact: true })
      .fill(formulaSafeName);
    // Select compound type: Small molecule (first entity selector)
    await page.getByText("(none selected)").first().click();
    await page
      .getByRole("cell", { name: "Small molecule", exact: true })
      .click();
    // Select data type: text (now first remaining entity selector)
    await page.getByText("(none selected)").first().click();
    await page.getByRole("cell", { name: "text", exact: true }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL(
      /\/app\/core\/entities\/Grit::Compounds::CompoundProperty\/\d+/,
    );
    const compoundPropertyUrl = page.url();

    // --- Upload data form ---
    await page.goto(IMPORT_URL);
    await expect(page.getByText("Import Compounds")).toBeVisible();

    await page.getByRole("textbox", { name: "Name" }).fill(loadSetName);

    // Select origin for the load set itself
    await page.getByText("(none selected)").first().click();
    await page.getByRole("cell", { name: "ADMIN" }).click();

    // Upload the SDF file
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText("Drag and drop, or click to").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(sdfPath);

    await page.getByRole("button", { name: "Start" }).click();

    // Configure the block
    await expect(
      page.getByRole("heading", { name: "Configure blocks" }),
    ).toBeVisible();

    // Select compound type
    await page.getByText("(none selected)").first().click();
    await page
      .getByRole("cell", { name: "Small molecule", exact: true })
      .click();

    await page.getByRole("button", { name: "Continue" }).click();

    // --- Mapping form ---
    await expect(page).toHaveURL(/\/app\/core\/load_sets\/\d+/);
    await expect(
      page.getByRole("heading", { name: "Map columns to properties" }),
    ).toBeVisible();

    // Map Name field → DATABASE_ID column
    await selectMappingColumn(page, "Name", "DATABASE_ID");

    // Map Formula compound property → JCHEM_FORMULA column
    await selectMappingColumn(page, formulaPropertyName, "JCHEM_FORMULA");

    // Set Origin as a constant value "drugbank"
    // Click the "Use a constant value" toggle that immediately follows the "Origin" label
    // (clicking the visible <label> element toggles its wrapped checkbox)
    await page
      .locator("form")
      .locator(
        'xpath=.//label[normalize-space()="Origin"]/following::label[contains(.,"Use a constant value")][1]',
      )
      .click();
    await page.getByText("(none selected)").first().click();
    await page
      .locator("#dialog")
      .getByText("drugbank", { exact: true })
      .click();

    // --- Validate then confirm ---
    await page.getByRole("button", { name: "Validate" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByText("succe")).toBeVisible();

    // --- Cleanup: undo import, delete origin, delete compound property ---
    await page.getByRole("button", { name: "Revert" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();

    await page.goto(originUrl);
    page.waitForEvent("dialog").then((dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();

    await page.goto(compoundPropertyUrl);
    page.waitForEvent("dialog").then((dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();
  });
});

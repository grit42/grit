import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3001/app/assays/assay-models/settings";
const ASSAY_MODELS_URL = BASE_URL + "/assay-models";
const ASSAY_TYPES_URL = BASE_URL + "/assay-types";

const uniqueName = (prefix: string) => `${prefix} ${Date.now()}`;

test.describe("Assay Model administration", () => {
  test("Create and publish assay model", async ({ page }) => {
    const assayTypeName = uniqueName("AssayType");
    const assayModelName = uniqueName("AssayModel");
    await page.goto(ASSAY_MODELS_URL);

    // Check admin loads correctly
    await expect(
      page.getByRole("heading", { name: "Assay Models administration" }),
    ).toBeVisible();
    await expect(page.getByText("Assay models", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Models", selected: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Metadata templates" }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Metadata", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Types" })).toBeVisible();

    // create assay type
    await page.getByRole("tab", { name: "Types" }).click();
    await page.getByRole("button", { name: "New" }).click();
    await page.getByRole("textbox", { name: "Name" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(assayTypeName);
    await page.getByRole("button", { name: "Save" }).click();

    // check redirect and reload
    await expect(page).toHaveURL(ASSAY_TYPES_URL);
    await expect(page.getByRole("cell", { name: assayTypeName })).toBeVisible();

    // create model
    await page.getByRole("tab", { name: "Models" }).click();
    await page.getByRole("button", { name: "New" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(assayModelName);
    await page.getByText("(none selected)").click();
    await page.getByRole("cell", { name: assayTypeName }).click();
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page).toHaveURL(
      /\/app\/assays\/assay-models\/settings\/assay-models\/\d+\/details/,
    );
    await expect(
      page.getByRole("heading", { name: "Publish this Assay Model" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Data sheets" })).toBeVisible();

    // create data sheet
    await page.getByRole("tab", { name: "Data sheets" }).click();
    await expect(
      page.getByRole("heading", { name: "New sheet" }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Name" }).fill("measurements");
    await page.getByRole("textbox", { name: "Sort" }).fill("0");
    await page.getByRole("button", { name: "Save" }).click();

    // create columns
    await page.getByRole("button", { name: "New" }).click();
    await page
      .locator("form")
      .filter({ hasText: "Name *Safe name *" })
      .getByPlaceholder("Name", { exact: true })
      .fill("animal_id");
    await page.getByRole("button", { name: 'Use "animal_id"' }).click();
    await page.getByText("(none selected)").first().click();
    await page.getByRole("cell", { name: "string" }).click();
    await page.getByText("Required").click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByRole("cell", { name: "animal_id" }).first(),
    ).toBeVisible();

    await page.getByRole("button", { name: "New" }).click();
    await page
      .locator("form")
      .filter({ hasText: "Name *Safe name *" })
      .getByPlaceholder("Name", { exact: true })
      .fill("value");
    await page.getByRole("button", { name: 'Use "value"' }).click();
    await page.getByText("(none selected)").first().click();
    await page.getByRole("cell", { name: "integer", exact: true }).click();
    await page.getByText("Required").click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByRole("cell", { name: "value" }).first(),
    ).toBeVisible();

    // publish and check details are disabled
    await page.getByRole("tab", { name: "Details" }).click();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByRole("textbox", { name: "Name" })).toBeDisabled();
    await expect(
      page.getByRole("heading", { name: "Enter dangerous edit mode" }),
    ).toBeVisible();

    // check data sheets are disabled
    await page.getByRole("tab", { name: "Data sheets" }).click();
    await expect(page.getByRole("button", { name: "New" })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "Name" })).toBeDisabled();
    await page.getByRole("cell", { name: "animal_id" }).first().click();
    await expect(
      page.getByRole("textbox", { name: "Name" }).nth(1),
    ).toBeDisabled();

    // check model is visible in assay models tab
    await page.getByRole("link", { name: "Assay Models" }).click();
    await expect(
      page.getByRole("cell", { name: assayModelName }),
    ).toBeVisible();

    // clean up model
    await page.goto(ASSAY_MODELS_URL);
    await page.getByRole("cell", { name: assayModelName }).click();

    await page.getByRole("button", { name: "Dangerous edit mode" }).click();

    await expect(page.locator("#dialog")).toContainText(
      `Dangerously edit ${assayModelName}?`,
    );
    await expect(
      page.getByText(`Type ${assayModelName} to confirm`),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "OK" })).toBeDisabled();
    await page.locator("#dialog").getByRole("textbox").fill(assayModelName);
    await expect(page.getByRole("button", { name: "OK" })).toBeEnabled();
    await page.getByRole("button", { name: "OK" }).click();

    await expect(
      page.getByRole("heading", { name: "Convert this Assay Model to draft" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "delete" }).click();
    await expect(page.locator("#dialog")).toContainText(
      `Delete assay model ${assayModelName}?`,
    );
    await expect(
      page.getByText(`Type ${assayModelName} to confirm`),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "OK" })).toBeDisabled();
    await page.locator("#dialog").getByRole("textbox").fill(assayModelName);
    await expect(page.getByRole("button", { name: "OK" })).toBeEnabled();
    await page.getByRole("button", { name: "OK" }).click();

    await expect(page).toHaveURL(ASSAY_MODELS_URL);
    await expect(page.getByRole("cell", { name: assayModelName })).toHaveCount(
      0,
    );

    // clean up type
    await page.goto(ASSAY_TYPES_URL);
    await page.getByRole("cell", { name: assayTypeName }).click();
    page.waitForEvent("dialog").then((dialog) => {
      expect(
        dialog,
        "Are you sure you want to delete this assay type? This action is irreversible",
      );
      dialog.accept();
    });
    await page.getByRole("button", { name: "delete" }).click();
    await expect(page).toHaveURL(ASSAY_TYPES_URL);
    await expect(page.getByRole("cell", { name: assayTypeName })).toHaveCount(
      0,
    );

    // check model is not visible in assay models tab
    await page.getByRole("link", { name: "Assay Models" }).click();
    await expect(page.getByRole("cell", { name: assayModelName })).toHaveCount(
      0,
    );
  });
});

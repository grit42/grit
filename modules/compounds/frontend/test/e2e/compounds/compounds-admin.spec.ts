import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3001/app/compounds/settings/metadata";
const COMPOUNDS_URL = "http://localhost:3001/app/compounds/";

const uniqueName = (prefix: string) => `${prefix} ${Date.now()}`;

test.describe("Compound Admin", () => {
  test("Can create compound properties", async ({ page }) => {
    const compoundTypeName = uniqueName("CompoundType");
    const compoundPropertyName = uniqueName("CompoundProperty");
    await page.goto(BASE_URL);

    // Check page loads correctly
    await expect(
      page.getByRole("heading", { name: "Compounds administration" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Metadata" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Load sets" })).toBeVisible();
    await expect(page.getByText("Compound types")).toBeVisible();
    await expect(page.getByText("Compound properties")).toBeVisible();
    await expect(page.getByText("Batch properties")).toBeVisible();

    // Create a compound type
    await page.getByRole("button", { name: "New" }).first().click();
    await page.getByRole("textbox", { name: "Name" }).fill(compoundTypeName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByRole("cell", { name: compoundTypeName }),
    ).toBeVisible();

    // Create a compound property
    await page.getByRole("button", { name: "New" }).nth(1).click();
    await page.getByRole("textbox", { name: "Name", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Name", exact: true })
      .fill(compoundPropertyName);
    await page.getByRole("textbox", { name: "Name", exact: true }).press("Tab");
    await page
      .getByRole("textbox", { name: "Safe name" })
      .fill(compoundPropertyName.replace(" ", "_").toLowerCase());
    await page.getByText("(none selected)").nth(1).click();
    await page.getByRole("cell", { name: "string" }).click();
    await page.getByText("(none selected)").first().click();
    await page.getByRole("cell", { name: compoundTypeName }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByRole("cell", { name: compoundPropertyName }).first(),
    ).toBeVisible();

    // check compound type and property are displayed in the grid
    await page.goto(COMPOUNDS_URL);
    await expect(
      page.getByRole("button", { name: "Small molecule" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: compoundTypeName }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: compoundTypeName }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: compoundPropertyName }),
    ).toBeVisible();

    // check that headers are hidden/shown when type selection is changed
    await page.getByRole("button", { name: "Small molecule" }).click();
    await expect(
      page.getByRole("columnheader", { name: compoundTypeName }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("columnheader", { name: compoundPropertyName }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: compoundTypeName }).click();
    await expect(
      page.getByRole("columnheader", { name: compoundTypeName }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: compoundPropertyName }),
    ).toBeVisible();

    // remove type
    await page.goto(BASE_URL);
    await page.getByRole("cell", { name: compoundTypeName }).first().click();
    page.waitForEvent("dialog").then((dialog) => {
      dialog.accept();
    });
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(BASE_URL);

    // check columns are not displayed after type was removed
    await page.getByRole("link", { name: "Compounds" }).click();
    await expect(
      page.getByRole("button", { name: compoundTypeName }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("columnheader", { name: compoundTypeName }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("columnheader", { name: compoundPropertyName }),
    ).toHaveCount(0);
  });
});

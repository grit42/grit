import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3001/app/core/vocabularies";

// Helper to generate unique names
const uniqueName = (prefix: string) => `${prefix} ${Date.now()}`;

test.describe("Vocabularies CRUD", () => {
  test("can view vocabularies list", async ({ page }) => {
    await page.goto(BASE_URL);

    // Verify page loaded correctly
    await expect(page).toHaveURL(BASE_URL);
    await expect(page.getByText("Vocabularies").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "New" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Filters" })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Description" }),
    ).toBeVisible();
    await expect(page.getByText(/\d+ records/)).toBeVisible();
  });

  test("can create a new vocabulary", async ({ page }) => {
    const vocabName = uniqueName("Test Vocabulary");

    // Navigate to vocabularies list
    await page.goto(BASE_URL);
    await expect(page.getByText("Vocabularies").first()).toBeVisible();

    // Click New button
    await page.getByRole("button", { name: "New" }).click();
    await expect(page).toHaveURL(`${BASE_URL}/new`);

    // Verify form fields
    await expect(page.getByText("Name *")).toBeVisible();
    await expect(page.getByText("Description")).toBeVisible();
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();

    // Fill in the form
    await page.getByPlaceholder("Name").fill(vocabName);
    await page.getByPlaceholder("Description").fill("Test description");

    // Verify Save button appears
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Revert changes" }),
    ).toBeVisible();

    // Save the vocabulary
    await page.getByRole("button", { name: "Save" }).click();

    // Verify redirected to detail page with saved data
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Items" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Load sets" })).toBeVisible();

    // Verify the saved data is shown in the form
    await expect(page.getByPlaceholder("Name")).toHaveValue(vocabName);
    await expect(page.getByPlaceholder("Description")).toHaveValue(
      "Test description",
    );

    // Clean up: delete the vocabulary directly from the detail page
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();

    // Verify redirected to list
    await expect(page).toHaveURL(BASE_URL);
  });

  test("can edit an existing vocabulary", async ({ page }) => {
    const originalName = uniqueName("Edit Test Vocab");
    const editedName = uniqueName("Edited Vocab");

    // Create a vocabulary first
    await page.goto(BASE_URL);
    await page.getByRole("button", { name: "New" }).click();
    await page.getByPlaceholder("Name").fill(originalName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);

    // Wait for the vocabulary detail page to fully load
    await expect(page.getByRole("tab", { name: "Items" })).toBeVisible();

    // Edit the vocabulary name - clear first then fill
    await page.getByPlaceholder("Name").clear();
    await page.getByPlaceholder("Name").fill(editedName);

    // Verify Save button appears
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();

    // Save the changes
    await page.getByRole("button", { name: "Save" }).click();

    // Wait for save to complete (Save button should disappear)
    await expect(page.getByRole("button", { name: "Save" })).not.toBeVisible();

    // Verify the edited name is shown in the form
    await expect(page.getByPlaceholder("Name")).toHaveValue(editedName);

    // Clean up: delete the vocabulary directly from detail page
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page).toHaveURL(BASE_URL);
  });

  test("can delete a vocabulary", async ({ page }) => {
    const vocabName = uniqueName("Delete Test Vocab");

    // Create a vocabulary first
    await page.goto(BASE_URL);
    await page.getByRole("button", { name: "New" }).click();
    await page.getByPlaceholder("Name").fill(vocabName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);

    // Verify Delete button is visible
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();

    // Set up dialog handler and delete
    page.on("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        "Are you sure you want to delete this vocabulary? This action is irreversible",
      );
      dialog.accept();
    });
    await page.getByRole("button", { name: "Delete" }).click();

    // Verify redirected to list and vocabulary is gone
    await expect(page).toHaveURL(BASE_URL);
    await expect(page.getByText(vocabName)).toHaveCount(0);
  });
});

test.describe("Vocabulary Items CRUD", () => {
  test("can create a vocabulary item within a vocabulary", async ({ page }) => {
    const vocabName = uniqueName("Item Test Vocab");
    const itemName = uniqueName("Test Item");

    // Create a vocabulary first
    await page.goto(BASE_URL);
    await page.getByRole("button", { name: "New" }).click();
    await page.getByPlaceholder("Name").fill(vocabName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);

    // Verify Items tab is selected and table is empty
    await expect(page.getByRole("tab", { name: "Items" })).toBeVisible();
    await expect(page.getByText("No data")).toBeVisible();

    // Click New to create an item
    await page.getByRole("button", { name: "New" }).click();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+\/new$/);

    // Verify Cancel button appears for item form
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // Fill in the item form - use nth(1) for the second Name placeholder (the item form)
    await page.getByPlaceholder("Name").nth(1).fill(itemName);

    // Verify Save button appears and save
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await page.getByRole("button", { name: "Save" }).click();

    // Verify we're back on vocabulary detail and item appears in the table
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);
    await expect(page.getByRole("cell", { name: itemName })).toBeVisible();
    await expect(page.getByText("1 records")).toBeVisible();

    // Clean up: delete the item
    await page.getByRole("cell", { name: itemName }).click();
    page.on("dialog", (dialog) => dialog.accept());
    // The item detail page has Cancel and Delete buttons
    // Click the Delete button for the item (nth(1) because vocab Delete is first)
    await page.getByRole("button", { name: "Delete" }).nth(1).click();

    // Wait for item to be deleted and back on vocab detail
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);
    await expect(page.getByText("No data")).toBeVisible();
    await expect(page.getByText("0 records")).toBeVisible();

    // Clean up: delete the vocabulary (now there's only one Delete button)
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(BASE_URL);
  });

  test("can edit a vocabulary item", async ({ page }) => {
    const vocabName = uniqueName("Edit Item Vocab");
    const originalItemName = uniqueName("Original Item");
    const editedItemName = uniqueName("Edited Item");

    // Create a vocabulary and item
    await page.goto(BASE_URL);
    await page.getByRole("button", { name: "New" }).click();
    await page.getByPlaceholder("Name").fill(vocabName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);

    // Create an item
    await page.getByRole("button", { name: "New" }).click();
    await page.getByPlaceholder("Name").nth(1).fill(originalItemName);
    await page.getByRole("button", { name: "Save" }).click();

    // Verify item appears
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);
    await expect(
      page.getByRole("cell", { name: originalItemName }),
    ).toBeVisible();

    // Click on the item to edit
    await page.getByRole("cell", { name: originalItemName }).click();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+\/\d+$/);

    // Verify Cancel and Delete buttons on the item form
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    // There are 2 Delete buttons - one for vocab, one for item
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(2);

    // Edit the item - clear first then fill using nth(1) for the item form's Name field
    await page.getByPlaceholder("Name").nth(1).clear();
    await page.getByPlaceholder("Name").nth(1).fill(editedItemName);

    // Save the changes
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await page.getByRole("button", { name: "Save" }).click();

    // After saving an item edit, the page automatically navigates back to vocabulary detail
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);

    // Verify the change in the items table
    await expect(
      page.getByRole("cell", { name: editedItemName }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: originalItemName }),
    ).toHaveCount(0);

    // Clean up: delete the item
    await page.getByRole("cell", { name: editedItemName }).click();
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).nth(1).click();

    // Wait for item to be deleted
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);
    await expect(page.getByText("No data")).toBeVisible();

    // Clean up: delete the vocabulary (now there's only one Delete button)
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(BASE_URL);
  });

  test("can delete a vocabulary item", async ({ page }) => {
    const vocabName = uniqueName("Delete Item Vocab");
    const itemName = uniqueName("Delete Item");

    // Create a vocabulary
    await page.goto(BASE_URL);
    await page.getByRole("button", { name: "New" }).click();
    await page.getByPlaceholder("Name").fill(vocabName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);

    // Create an item
    await page.getByRole("button", { name: "New" }).click();
    await page.getByPlaceholder("Name").nth(1).fill(itemName);
    await page.getByRole("button", { name: "Save" }).click();

    // Verify item appears
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);
    await expect(page.getByRole("cell", { name: itemName })).toBeVisible();
    await expect(page.getByText("1 records")).toBeVisible();

    // Click on the item
    await page.getByRole("cell", { name: itemName }).click();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+\/\d+$/);

    // Delete the item - set up dialog handler first
    page.on("dialog", (dialog) => dialog.accept());
    // Click the item's Delete button (nth(1) since vocab Delete is nth(0))
    await page.getByRole("button", { name: "Delete" }).nth(1).click();

    // Verify item is deleted and we're back on vocabulary detail
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);
    await expect(page.getByText("No data")).toBeVisible();
    await expect(page.getByText("0 records")).toBeVisible();
    await expect(page.getByRole("cell", { name: itemName })).toHaveCount(0);

    // Clean up: delete the vocabulary (now there's only one Delete button)
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(BASE_URL);
  });

  test("can navigate between vocabulary and its items", async ({ page }) => {
    const vocabName = uniqueName("Navigate Vocab");
    const itemName = uniqueName("Navigate Item");

    // Create a vocabulary
    await page.goto(BASE_URL);
    await page.getByRole("button", { name: "New" }).click();
    await page.getByPlaceholder("Name").fill(vocabName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);

    // Verify Items tab is selected by default
    await expect(
      page.getByRole("tab", { name: "Items", selected: true }),
    ).toBeVisible();

    // Create an item
    await page.getByRole("button", { name: "New" }).click();
    await page.getByPlaceholder("Name").nth(1).fill(itemName);
    await page.getByRole("button", { name: "Save" }).click();

    // Verify item appears
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);
    await expect(page.getByRole("cell", { name: itemName })).toBeVisible();

    // Click on Load sets tab
    await page.getByRole("tab", { name: "Load sets" }).click();
    await expect(
      page.getByRole("tab", { name: "Load sets", selected: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Origin" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();

    // Click back on Items tab
    await page.getByRole("tab", { name: "Items" }).click();
    await expect(
      page.getByRole("tab", { name: "Items", selected: true }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: itemName })).toBeVisible();

    // Click on the item to open detail
    await page.getByRole("cell", { name: itemName }).click();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+\/\d+$/);

    // Click Cancel to go back
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);
    await expect(page.getByRole("tab", { name: "Items" })).toBeVisible();
    await expect(page.getByRole("cell", { name: itemName })).toBeVisible();

    // Click Back button on vocabulary detail - should navigate to list
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(BASE_URL);

    // Navigate back to vocab using browser back to avoid pagination issues
    await page.goBack();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);
    await expect(page.getByRole("cell", { name: itemName })).toBeVisible();

    // Clean up: delete the item first
    await page.getByRole("cell", { name: itemName }).click();
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+\/\d+$/);
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).nth(1).click();

    // Wait for item to be deleted and back on vocab detail
    await expect(page).toHaveURL(/\/app\/core\/vocabularies\/\d+$/);
    await expect(page.getByText("No data")).toBeVisible();

    // Clean up: delete the vocabulary (now there's only one Delete button)
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(BASE_URL);
  });
});

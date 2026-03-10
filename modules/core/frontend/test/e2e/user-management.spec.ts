import { test, expect } from "@playwright/test";

const BASE_URL =
  "http://localhost:3001/app/core/administration/user-management/users";

// Helper to generate unique names
const uniqueName = (prefix: string) => `${prefix} ${Date.now()}`;

test.describe("User Management", () => {
  test("can view users list with expected columns and seeded admin user", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    // Verify page loaded correctly
    await expect(page).toHaveURL(BASE_URL);
    await expect(page.getByText("Users").first()).toBeVisible();

    // Verify table column headers
    await expect(
      page.getByRole("columnheader", { name: "Login" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Email" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Origin" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Active" }),
    ).toBeVisible();

    // Verify New button is available
    await expect(page.locator("#circle-1new_svg__circle-new")).toBeVisible();

    // Verify seeded admin user appears in the table
    await expect(
      page.getByRole("cell", { name: "admin", exact: true }),
    ).toBeVisible();

    // Verify Users and Roles sub-tabs
    await expect(page.getByRole("tab", { name: "Users" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Roles" })).toBeVisible();
  });

  test("can create a new user and see activation link", async ({ page }) => {
    const login = uniqueName("testuser").toLowerCase().replace(/\s/g, "");
    const name = uniqueName("Test User");
    const email = `${login}@example.com`;

    // Navigate to users list
    await page.goto(BASE_URL);
    await expect(page.getByText("Users").first()).toBeVisible();

    // Click New button
    await page.locator("#circle-1new_svg__circle-new").click();

    await expect(page).toHaveURL(`${BASE_URL}/new`);

    // Verify form field labels are visible
    await expect(page.getByText("Login *")).toBeVisible();
    await expect(page.getByText("Name *")).toBeVisible();
    await expect(page.getByText("Email *")).toBeVisible();
    await expect(page.getByText("Origin *")).toBeVisible();

    // Verify Active toggle is disabled on new user form
    await expect(page.getByLabel("Active")).toBeDisabled();

    // Verify no Delete button on new user form
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);

    // Fill in required text fields
    await page.getByPlaceholder("Login").fill(login);
    await page.getByPlaceholder("Name").fill(name);
    await page.getByPlaceholder("Email").fill(email);

    // Select Origin via entity selector dialog
    // Click the first "(none selected)" placeholder (Origin is first entity field)
    await page.getByText("(none selected)").first().click();
    await expect(page.getByText("Select Origin")).toBeVisible();
    await page.getByRole("cell", { name: "ADMIN", exact: true }).click();

    // Save the user
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await page.getByRole("button", { name: "Save" }).click();

    // Verify redirected to user detail page
    await expect(page).toHaveURL(
      /\/app\/core\/administration\/user-management\/users\/\d+$/,
    );

    // Verify saved values are shown in the form
    await expect(page.getByPlaceholder("Login")).toHaveValue(login);
    await expect(page.getByPlaceholder("Name")).toHaveValue(name);
    await expect(page.getByPlaceholder("Email")).toHaveValue(email);

    // Verify Login field is now disabled (editing mode)
    await expect(page.getByPlaceholder("Login")).toBeDisabled();

    // Verify Activation link section
    await expect(
      page.getByRole("heading", { name: "Activation link" }),
    ).toBeVisible();
    await expect(page.getByText(/\/app\/core\/activate\/.+/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Revoke activation token" }),
    ).toBeVisible();

    // Verify Reset password link section
    await expect(
      page.getByRole("heading", { name: "Reset password link" }),
    ).toBeVisible();

    // Verify API token section
    await expect(
      page.getByRole("heading", { name: "API token" }),
    ).toBeVisible();

    // Clean up: delete the created user
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(BASE_URL);

    // Verify the deleted user no longer appears in the list
    await expect(page.getByRole("cell", { name: login })).toHaveCount(0);
  });
});

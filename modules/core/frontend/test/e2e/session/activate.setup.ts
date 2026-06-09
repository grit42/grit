import { test as setup, expect } from "@playwright/test";

setup("activate admin user", async ({ page }) => {
  await page.goto("http://localhost:3001/app/core/authenticate");

  await page.getByPlaceholder("username").fill("admin");
  await page.getByPlaceholder("password").fill("testtest");
  await page.getByText("Please let me in").click();

  // Wait for either: redirect to vocabularies (user is activated) OR "is inactive" message (user needs activation)
  const inactiveMessage = page.getByText("is inactive");
  const vocabulariesUrl = "http://localhost:3001/app/core/vocabularies";

  // Use Promise.race to detect which scenario we're in
  const result = await Promise.race([
    page.waitForURL(vocabulariesUrl).then(() => "activated"),
    inactiveMessage.waitFor({ state: "visible" }).then(() => "inactive"),
  ]);

  if (result === "inactive") {
    // User is inactive, need to activate them
    await page.goto("http://localhost:3001/app/core/activate/admin");
    await page
      .getByRole("textbox", { name: "Password", exact: true })
      .fill("testtest");
    await page
      .getByRole("textbox", { name: "Confirm password", exact: true })
      .fill("testtest");
    await page.getByRole("button", { name: "activate" }).click();
    await page.waitForURL(vocabulariesUrl);
  }

  // Verify we ended up on the vocabularies page
  await expect(page).toHaveURL(vocabulariesUrl);
});

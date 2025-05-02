import { test as setup } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  await page.goto("http://localhost:3001/core/authenticate");

  await page.getByPlaceholder("username").fill("admin");
  await page.getByPlaceholder("password").fill("testtest");
  await page.getByText("Please let me in").click();

  await page.waitForURL("http://localhost:3001/core/entities");

  await page.context().storageState({ path: authFile });
});

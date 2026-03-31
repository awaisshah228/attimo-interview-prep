import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("renders the heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Next Template"
    );
  });

  test("renders all button variants", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Outline" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Secondary" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Ghost" })).toBeVisible();
  });

  test("has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    expect(errors).toHaveLength(0);
  });

  test("input is focusable and typeable", async ({ page }) => {
    await page.goto("/");
    const input = page.getByPlaceholder("Type something...");
    await input.fill("Hello Playwright");
    await expect(input).toHaveValue("Hello Playwright");
  });
});

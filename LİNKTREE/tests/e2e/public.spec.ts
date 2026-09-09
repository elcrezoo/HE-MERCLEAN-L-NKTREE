import { expect, test } from "@playwright/test";

test("TR experience, persona and locale work", async ({ page }) => {
  const analytics: { eventName?: string; persona?: string }[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/analytics/events") && request.method() === "POST") {
      analytics.push(request.postDataJSON());
    }
  });
  await page.goto("/tr");
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("HeimerClean");
  await expect(page.getByRole("heading", { level: 2, name: /Yavaşlama sinyallerinden/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kolay, sessiz temizlik ve optimizasyon." })).toBeVisible();
  await page.getByRole("button", { name: "IT", exact: true }).click();
  await expect(page).toHaveURL(/for=it/);
  await expect(page.getByRole("heading", { name: "Yönetilen cihazlar için görünürlük odağı." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Kurumsal çözümü incele/ })).toHaveAttribute("href", "/go/website");
  await page.getByRole("button", { name: "IT", exact: true }).click();
  await expect.poll(() => analytics.filter((item) => item.eventName === "page_view").length).toBe(1);
  await expect.poll(() => analytics.filter((item) => item.eventName === "persona_selected" && item.persona === "it").length).toBe(1);
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/en\?for=it/);
  await expect(page.getByRole("heading", { name: "A visibility focus for managed endpoints." })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /slowdown signals/ })).toBeVisible();
});

test("investor persona exposes sourced startup routes and keeps all links", async ({ page }) => {
  await page.goto("/en?for=investor");
  await expect(page.getByRole("heading", { name: "A scalable approach to the Windows maintenance problem." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open Crunchbase profile/ })).toHaveAttribute("href", "/go/crunchbase");
  await expect(page.getByRole("navigation", { name: "Startup verification links" }).getByRole("link")).toHaveCount(2);
  await expect(page.locator(".hub-link")).toHaveCount(11);
  await expect(page.locator(".hub-link").first()).toContainText("Crunchbase");
});

test("public page has no horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/tr");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("product gallery and all official links are available", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByLabel("Language selection")).toBeVisible();
  await expect(page.locator(".hub-link")).toHaveCount(11);
  await page.getByRole("tab", { name: /Reports/ }).click();
  await expect(page.locator(".preview-frame img")).toHaveAttribute("src", /report/);
  await page.getByRole("button", { name: "Enlarge product screenshot" }).click();
  await expect(page.getByRole("dialog", { name: "Enlarged product screen" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Enlarged product screen" })).toBeHidden();
});

test("admin panel requires authentication", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const impact = (page: Page) => page.locator(".impact-score");

function samplePng(page: Page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 300;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#b87c51";
    ctx.fillRect(0, 0, 300, 300);
    ctx.fillStyle = "#28261b";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText("MONDAY", 50, 165);
    return canvas.toDataURL("image/png").split(",")[1];
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator(".scene-loading")).toHaveCount(0);
});

test("typing a target and pressing Enter starts the game", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(page).toHaveTitle("Digital Dartboard");

  const input = page.getByLabel("Target text");
  await expect(input).toBeFocused();
  await input.fill("Monday standup");
  await input.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const board = page.getByRole("application");
  await expect(board).toBeFocused();
  await board.press("Enter");
  await expect(impact(page)).toHaveText("+50");

  await board.press("ArrowUp");
  await board.press("ArrowUp");
  await board.press("Space");
  await expect(impact(page)).toHaveText("+20");

  await page.getByRole("button", { name: "Clear" }).click();
  await expect(impact(page)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("the prompt has no submit buttons and no throwing instructions", async ({
  page,
}) => {
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("button[type=submit]")).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: /Pin it|Plain board/ }),
  ).toHaveCount(0);
  await expect(dialog.getByText("Add an image")).toBeVisible();
  await expect(dialog).not.toContainText("throw");
});

test("an empty prompt starts the plain board, and clicking throws", async ({
  page,
}) => {
  await page.getByLabel("Target text").press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("application").click();
  await expect(impact(page)).toHaveText(/^(\+\d+|MISS)$/);
});

test("the board fills the viewport and the page never scrolls", async ({
  page,
}) => {
  await page.getByLabel("Target text").press("Enter");
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const board = await page.getByRole("application").boundingBox();
    expect(board!.width).toBeCloseTo(width, 0);
    expect(board!.height).toBeCloseTo(844, 0);
    expect(
      await page.evaluate(() => ({
        x: document.documentElement.scrollWidth <= window.innerWidth,
        y: document.documentElement.scrollHeight <= window.innerHeight,
      })),
    ).toEqual({ x: true, y: true });
    await page.screenshot({ path: `test-results/layout-${width}.png` });
  }
});

test("the image area validates files and pins them without uploading", async ({
  page,
}) => {
  const input = page.locator("input[type=file]");
  await input.setInputFiles({
    name: "bad.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.getByRole("alert")).toHaveText(
    "Choose a JPG, PNG, WebP, or GIF image.",
  );
  await expect(page.getByRole("dialog")).toBeVisible();

  await input.setInputFiles({
    name: "target.png",
    mimeType: "image/png",
    buffer: Buffer.from(await samplePng(page), "base64"),
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({ path: "test-results/image-target.png" });
  await page.getByRole("application").click();
  await expect(impact(page)).toHaveText(/^(\+\d+|MISS)$/);
});

test("pasting an image anywhere in the prompt pins it", async ({ page }) => {
  await page.evaluate(
    async (base64) => {
      const blob = await (
        await fetch(`data:image/png;base64,${base64}`)
      ).blob();
      const transfer = new DataTransfer();
      transfer.items.add(new File([blob], "pasted.png", { type: "image/png" }));
      window.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: transfer,
          bubbles: true,
          cancelable: true,
        }),
      );
    },
    await samplePng(page),
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({ path: "test-results/pasted-target.png" });
});

test("sound toggles and a new target resets the session", async ({ page }) => {
  await page.getByLabel("Target text").press("Enter");
  await page.getByRole("button", { name: "Mute sound" }).click();
  await expect(
    page.getByRole("button", { name: "Enable sound" }),
  ).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("application").click();
  await expect(impact(page)).toHaveCount(1);
  await page.getByRole("button", { name: "New target" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Target text").fill("Round two");
  await page.getByLabel("Target text").press("Enter");
  await expect(impact(page)).toHaveCount(0);
});

test("Escape dismisses the prompt", async ({ page }) => {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test.describe("touch controls", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  test("a tap throws a dart on a phone", async ({ page }) => {
    await page.getByLabel("Target text").press("Enter");
    await page.getByRole("application").tap();
    await expect(impact(page)).toHaveText(/^(\+\d+|MISS)$/);
  });
});

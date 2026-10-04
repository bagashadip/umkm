import { expect, test } from "@playwright/test";

const enabled = process.env.AI_PLANNER_CONTENT_ENABLED === "true";

test("draft panel: tawarkan draft, terapkan hanya setelah klien setuju", async ({ page }) => {
  test.skip(!enabled, "butuh AI_PLANNER_CONTENT_ENABLED=true");

  await page.goto("/planner");
  await page.getByRole("button", { name: /Kuliner/ }).click();
  await page.getByLabel("Cari template").fill("editorial");
  await page.getByRole("button", { name: /Commerce Editorial/ }).click();
  await page.getByRole("button", { name: /Gunakan template ini/ }).click();

  await expect(page.getByRole("heading", { name: "Ceritakan usahamu" })).toBeVisible();
  const panel = page.getByLabel("Draft konten");
  await expect(panel).toBeVisible();
  await expect(panel.getByText("3 isian terbuka")).toBeVisible();

  // Nothing is written into the form before the client acts.
  await expect(page.getByLabel("Kalimat pembuka")).toHaveValue("");
  await page.getByLabel("Nama usaha").fill("Kedai Uji Coba");

  await page.getByLabel("Singkatkan usahamu").fill("warung sarapan rumahan dekat kampus, buka jam enam pagi, menu andalan nasi uduk");
  // Gemini can retry a busy model before answering, so wait for the reply
  // itself rather than betting on it landing inside the expect timeout.
  const draftResponse = page.waitForResponse(
    (r) => r.url().includes("/ai/draft") && r.request().method() === "POST",
  );
  await panel.getByRole("button", { name: /Buat draft/ }).click();
  await draftResponse;

  const draftBox = panel.locator("li");
  await expect(draftBox.first()).toBeVisible();
  await expect(draftBox.first()).toContainText("Kalimat pembuka");

  // Review before apply: the form is still untouched.
  await expect(page.getByLabel("Kalimat pembuka")).toHaveValue("");

  await panel.getByRole("button", { name: /Pakai draft ini/ }).click();
  await expect(page.getByLabel("Kalimat pembuka")).not.toHaveValue("");

  // Slots the template never declared cannot be reached by a draft.
  await expect(page.getByLabel("Nomor WhatsApp")).toHaveValue("");
  await expect(page.getByLabel("Jam operasional")).toHaveValue("");
  // Applied means dismissed: the suggestion is gone, the offer to draft again is back.
  await expect(panel.getByRole("button", { name: /Buat draft/ })).toBeVisible();

  // The project only changes once the client submits the form itself.
  const response = page.waitForResponse(
    (r) => r.url().includes("/business") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Lihat preview/ }).click();
  const payload = (await (await response).request().postDataJSON()) as Record<string, unknown>;
  expect(payload).not.toHaveProperty("whatsapp");
  expect(payload).not.toHaveProperty("pricePlan");
  expect(payload).not.toHaveProperty("features");
  await expect(page.getByTestId("prototype")).toBeVisible();
});

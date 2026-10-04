import { expect, test } from "@playwright/test";
import { Client } from "pg";

test("landing → kategori → template → data → preview → domain → checkout → pembayaran", async ({ page }) => {
  const api = "http://localhost:3211/api";
  let sessionId = "";
  let projectId = "";
  let checkoutId = "";

  await page.route(`${api}/planner/start`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    sessionId = body.sessionId;
    await route.fulfill({ response });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Usahamu punya tempat sendiri/ })).toBeVisible();
  await page.getByRole("link", { name: "Mulai buat website" }).first().click();
  await expect(page).toHaveURL(/\/planner$/);

  // 1. Kategori
  await expect(page.getByRole("heading", { name: "Kategori bisnis" })).toBeVisible();
  await page.getByRole("button", { name: /Kuliner/ }).click();

  // 2. Template
  await expect(page.getByRole("heading", { name: /Pilih gaya untuk Kuliner/ })).toBeVisible();
  await page.route(`${api}/website-flow/projects`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    projectId = body.id;
    await route.fulfill({ response });
  });
  await page.getByRole("button", { name: /Story-led/ }).click();
  await expect(page.getByRole("dialog", { name: /Template preview/ })).toBeVisible();
  await page.getByRole("button", { name: /Gunakan template ini/ }).click();

  // 3. Data bisnis
  await expect(page.getByRole("heading", { name: "Ceritakan usahamu" })).toBeVisible();
  await page.getByLabel("Nama usaha").fill("Kedai Rasa Pagi");
  await page.getByLabel("Kalimat pembuka").fill("Sarapan hangat setiap pagi");
  await page.getByLabel("WhatsApp (opsional)").fill("08123456789");
  await page.getByLabel("Nama produk 1").fill("Kopi susu gula aren");
  await page.getByLabel("Harga produk 1").fill("Rp 18.000");

  const preview = page.waitForResponse((r) => r.url().includes(`/website-flow/projects/${projectId || "x"}/business`) && r.request().method() === "POST");
  await page.getByRole("button", { name: /Lihat preview/ }).click();
  const previewResponse = await preview;
  expect(previewResponse.ok()).toBe(true);

  // 4. Preview
  await expect(page.getByRole("heading", { name: "Ini bentuk awal websitemu" })).toBeVisible();
  await expect(page.getByTestId("prototype")).toBeVisible();
  await expect(page.getByText("Sarapan hangat setiap pagi", { exact: true })).toBeVisible();
  await expect(page.getByText("Kopi susu gula aren", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Lanjut cek domain/ }).click();

  // 5. Domain
  await expect(page.getByRole("heading", { name: "Punya alamat yang ingin dipakai?" })).toBeVisible();
  await page.getByLabel("Nama domain").fill("kedairasapagi.id");
  await page.getByRole("button", { name: /Cek domain/ }).click();
  await expect(page.getByText("tersedia.", { exact: false })).toBeVisible();

  // 6. Checkout
  await expect(page.getByRole("heading", { name: "Ringkasan pesanan" })).toBeVisible();
  await page.route(`${api}/website-flow/projects/*/checkout`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    checkoutId = body.checkoutId;
    await route.fulfill({ response });
  });
  await page.getByRole("button", { name: /Buat checkout/ }).click();
  await expect(page.getByText("Total", { exact: true })).toBeVisible();
  await expect(page.getByText("Rp", { exact: false })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Pembayaran" })).toBeVisible();
  await page.getByRole("button", { name: /Catat pembayaran/ }).click();
  await expect(page.getByRole("heading", { name: "Pembayaran tercatat" })).toBeVisible();

  // API-persisted data
  const projectResponse = await page.request.get(`${api}/website-flow/projects/${projectId}`);
  expect(projectResponse.ok()).toBe(true);
  const project = await projectResponse.json();
  expect(project.businessData.name).toBe("Kedai Rasa Pagi");
  expect(project.previewConfig.businessName).toBe("Kedai Rasa Pagi");

  const db = new Client({ connectionString: process.env.DATABASE_URL ?? "postgresql://bagashadi:12345@localhost:5432/umkm_platform" });
  await db.connect();
  try {
    const stored = await db.query('SELECT "id", "currentStep", "businessData" FROM "WebsiteProject" WHERE "id" = $1', [projectId]);
    expect(stored.rows).toHaveLength(1);
    expect(Number(stored.rows[0].currentStep)).toBeGreaterThanOrEqual(5);

    const checkout = await db.query('SELECT "id", "amount", "status" FROM "Checkout" WHERE "id" = $1', [checkoutId]);
    expect(checkout.rows).toHaveLength(1);
    expect(Number(checkout.rows[0].amount)).toBeGreaterThan(0);

    const payments = await db.query('SELECT "method", "status" FROM "Payment" WHERE "checkoutId" = $1', [checkoutId]);
    expect(payments.rows).toHaveLength(1);
    expect(payments.rows[0].status).toBe("pending");
  } finally {
    await db.query('DELETE FROM "Payment" WHERE "checkoutId" = $1', [checkoutId]).catch(() => undefined);
    await db.query('DELETE FROM "Checkout" WHERE "id" = $1', [checkoutId]).catch(() => undefined);
    await db.query('DELETE FROM "WebsiteProject" WHERE "id" = $1', [projectId]).catch(() => undefined);
    await db.query('DELETE FROM "PlannerSession" WHERE "id" = $1', [sessionId]).catch(() => undefined);
    await db.end();
  }
});

test("kembali ke langkah sebelumnya tidak memutus alur", async ({ page }) => {
  await page.goto("/planner");
  await expect(page.getByRole("heading", { name: "Kategori bisnis" })).toBeVisible();
  await page.getByRole("button", { name: /Jasa/ }).click();
  await expect(page.getByRole("heading", { name: /Pilih gaya untuk Jasa/ })).toBeVisible();
  await page.getByRole("button", { name: /Catalog-first/ }).click();
  await page.getByRole("button", { name: /Gunakan template ini/ }).click();
  await expect(page.getByRole("heading", { name: "Ceritakan usahamu" })).toBeVisible();
  await page.getByRole("button", { name: "Kembali" }).click();
  await expect(page.getByRole("heading", { name: /Pilih gaya untuk Jasa/ })).toBeVisible();
});

test("template dinamis menyusun form dari content schema sendiri", async ({ page }) => {
  await page.goto("/planner");
  await page.getByRole("button", { name: /Kuliner/ }).click();

  // The catalog searches the server, not the full list on the client.
  await expect(page.getByRole("heading", { name: /Pilih gaya untuk Kuliner/ })).toBeVisible();
  await page.getByLabel("Cari template").fill("editorial");
  await expect(page.getByText("1 template untuk Kuliner")).toBeVisible();

  await page.getByRole("button", { name: /Commerce Editorial/ }).click();
  // Preview renders from the template's own sample data before any selection.
  const dialog = page.getByRole("dialog", { name: /Template preview/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 1, name: /Rasa rumahan/ })).toBeVisible();
  await page.getByRole("button", { name: /Kembali ke katalog/ }).click();
  await expect(page.getByRole("heading", { name: /Pilih gaya untuk Kuliner/ })).toBeVisible();

  await page.getByRole("button", { name: /Commerce Editorial/ }).click();
  await page.getByRole("button", { name: /Gunakan template ini/ }).click();

  // Form comes from the template, not a fixed set of inputs.
  await expect(page.getByRole("heading", { name: "Ceritakan usahamu" })).toBeVisible();
  await expect(page.getByLabel("Nama usaha")).toBeVisible();
  await expect(page.getByLabel("Kalimat pembuka")).toBeVisible();
  await expect(page.getByLabel("Jam operasional")).toBeVisible();
  await expect(page.getByLabel("Keunggulan utama 1 — judul")).toBeVisible();
  // Fields the template does not declare must not appear.
  await expect(page.getByLabel("Lokasi (opsional)")).toHaveCount(0);

  await page.getByLabel("Nama usaha").fill("Warung Coblong");
  await page.getByLabel("Kalimat pembuka").fill("Masakan rumah, buka setiap hari.");
  await page.getByLabel("Nomor WhatsApp").fill("08123456789");
  await page.getByLabel("Alamat atau area layanan").fill("Bandung");

  const response = page.waitForResponse(
    (r) => r.url().includes("/business") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Lihat preview/ }).click();
  expect((await response).ok()).toBe(true);

  // Preview is rendered from the template definition and its own theme.
  await expect(page.getByTestId("prototype")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Masakan rumah/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Warung Coblong" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Menu kami" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Chat Warung Coblong/ }).first()).toBeVisible();
});

/**
 * AI drafts are opt-in. With the flag off the panel never renders, so the form
 * stays the only way data reaches the project — the same guarantee holds when
 * it is on, because a draft only ever lands after the client applies it.
 */
test("draft konten tidak muncul selama fitur AI masih nonaktif", async ({ page }) => {
  test.skip(process.env.AI_PLANNER_CONTENT_ENABLED === "true", "butuh fitur AI nonaktif");

  await page.goto("/planner");
  await page.getByRole("button", { name: /Kuliner/ }).click();
  await page.getByLabel("Cari template").fill("editorial");
  await page.getByRole("button", { name: /Commerce Editorial/ }).click();
  await page.getByRole("button", { name: /Gunakan template ini/ }).click();

  await expect(page.getByRole("heading", { name: "Ceritakan usahamu" })).toBeVisible();
  await expect(page.getByLabel("Draft konten")).toHaveCount(0);

  // The form still collects everything the template asks for.
  await page.getByLabel("Nama usaha").fill("Kedai Uji Saja");
  const response = page.waitForResponse(
    (r) => r.url().includes("/business") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Lihat preview/ }).click();
  expect((await response).ok()).toBe(true);
  await expect(page.getByTestId("prototype")).toBeVisible();
});

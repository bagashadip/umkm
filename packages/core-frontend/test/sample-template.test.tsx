import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  commerceEditorialTemplate,
  prototypeConfigSchema,
  resolveTemplatePreview,
  samplePrototypeConfig,
} from "@umkm/planner-engine";
import { PrototypeRenderer } from "../src/index";

const sample = prototypeConfigSchema.parse(samplePrototypeConfig);
afterEach(() => cleanup());

describe("sample template rendering", () => {
  const config = resolveTemplatePreview({
    template: commerceEditorialTemplate,
    category: { id: "kuliner", name: "Kuliner" },
    data: commerceEditorialTemplate.previewData,
  });

  it("renders every section the template declares", () => {
    render(<PrototypeRenderer config={config} />);
    expect(screen.getByRole("heading", { level: 1, name: /Rasa rumahan/ })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: /Kedai Rasa Pagi/ })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Menu kami" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Kenapa memilih kami" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Ada yang ingin ditanyakan?" })).toBeTruthy();
    expect(screen.getByRole("contentinfo")).toBeTruthy();
  });

  it("renders the featured product plus the catalog rows", () => {
    render(<PrototypeRenderer config={config} />);
    expect(screen.getByRole("heading", { name: "Kopi susu gula aren" })).toBeTruthy();
    expect(screen.getByText("Rp 18.000")).toBeTruthy();
    expect(screen.getByText("Favorit")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Roti bakar srikaya" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nasi ayam suwir" })).toBeTruthy();
  });

  it("applies the template theme to the root", () => {
    render(<PrototypeRenderer config={config} />);
    const root = screen.getByTestId("prototype") as HTMLElement;
    expect(root.style.getPropertyValue("--prototype-primary")).toBe("#264653");
    expect(root.style.getPropertyValue("--prototype-accent")).toBe("#E76F51");
    expect(root.style.getPropertyValue("--prototype-surface-alt")).toBe("#e9c46a");
    expect(root.style.getPropertyValue("--prototype-radius")).toBe("1rem");
    expect(root.style.getPropertyValue("--prototype-btn")).toBe("soft");
  });

  it("links the WhatsApp CTA to the client's number", () => {
    render(<PrototypeRenderer config={config} />);
    const links = screen.getAllByRole("link", { name: /Chat Kedai Rasa Pagi/ });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].getAttribute("href")).toContain("wa.me/628123456789");
  });

  it("states the client facts", () => {
    render(<PrototypeRenderer config={config} />);
    expect(screen.getByText("Melayani sejak")).toBeTruthy();
    expect(screen.getByText("2019")).toBeTruthy();
    expect(screen.getByText("Bandung, Jawa Barat")).toBeTruthy();
  });
});

describe("new section types", () => {
  const base = {
    businessName: "Studio Tenun",
    businessType: "Kerajinan",
    theme: { primary: "#264653", font: "Manrope, sans-serif", radius: "0.5rem" },
    features: ["landing_page"],
    products: [],
    paymentInstruction: "Hubungi kami.",
    whatsappNumber: "628000000000",
    seo: { title: "Studio Tenun", description: "Tenun lokal." },
  };

  it("renders gallery, feature, testimonial, and contact sections", () => {
    const config = prototypeConfigSchema.parse({
      ...base,
      sections: [
        { type: "gallery", enabled: true, title: "Galeri karya", images: [{ src: "/a.jpg", alt: "Kain tenun" }] },
        {
          type: "feature",
          enabled: true,
          title: "Kenapa di sini",
          items: [{ title: "Tenun tangan", body: "Dijalin satu per satu." }],
        },
        {
          type: "testimonial",
          enabled: true,
          title: "Kata pembeli",
          items: [{ quote: "Motifnya rapi sekali.", name: "Rina" }],
        },
        { type: "contact", enabled: true, title: "Temui kami", address: "Solo", hours: "Setiap hari" },
      ],
    });
    render(<PrototypeRenderer config={config} />);
    expect(screen.getByRole("heading", { name: "Galeri karya" })).toBeTruthy();
    expect(screen.getByAltText("Kain tenun")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Kenapa di sini" })).toBeTruthy();
    expect(screen.getByText("Dijalin satu per satu.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Kata pembeli" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Temui kami" })).toBeTruthy();
    expect(screen.getByText("Setiap hari")).toBeTruthy();
  });

  it("drops an optional section whose content the client never filled", () => {
    const config = prototypeConfigSchema.parse({
      ...base,
      sections: [{ type: "gallery", enabled: true, title: "Galeri", images: [] }],
    });
    render(<PrototypeRenderer config={config} />);
    expect(screen.queryByRole("heading", { name: "Galeri" })).toBeNull();
    expect(screen.getByText("Tidak ada bagian yang diaktifkan.")).toBeTruthy();
  });

  it("hides the WhatsApp CTA when no number can produce a link", () => {
    const config = prototypeConfigSchema.parse({
      ...base,
      whatsappNumber: "000",
      sections: [{ type: "whatsappCta", enabled: true, title: "Mau tanya?", body: "Tanya dulu." }],
    });
    render(<PrototypeRenderer config={config} />);
    expect(screen.queryByRole("heading", { name: "Mau tanya?" })).toBeNull();
  });

  it("renders product cards for templates without a full catalog", () => {
    const config = prototypeConfigSchema.parse({
      ...base,
      sections: [{ type: "productList", enabled: true, title: "Layanan kami" }],
    });
    render(<PrototypeRenderer config={config} />);
    expect(screen.getByText("Belum ada produk yang ditampilkan.")).toBeTruthy();
  });
});

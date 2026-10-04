import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup } from "@testing-library/react";
import { samplePrototypeConfig, prototypeConfigSchema } from "@umkm/planner-engine";
import { PrototypeRenderer } from "../src/index";

const sample = prototypeConfigSchema.parse(samplePrototypeConfig);
afterEach(() => cleanup());

describe("PrototypeRenderer", () => {
  it("renders enabled sections and products", () => {
    render(<PrototypeRenderer config={sample} />);
    expect(screen.getByRole("heading", { level: 1, name: "Rasa rumahan untuk pagi yang lebih nikmat" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Menu hari ini" })).toBeTruthy();
    expect(screen.getAllByText(/Kopi susu gula aren|Roti bakar srikaya|Nasi ayam suwir/).length).toBe(3);
  });

  it("omits disabled sections", () => {
    const config = { ...sample, sections: sample.sections.map((s) => (s.type === "productList" ? { ...s, enabled: false } : s)) };
    render(<PrototypeRenderer config={config} />);
    expect(screen.queryByRole("heading", { name: "Menu hari ini" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Cara bayar" })).toBeTruthy();
  });

  it("omits every section when all are disabled", () => {
    render(<PrototypeRenderer config={{ ...sample, sections: sample.sections.map((s) => ({ ...s, enabled: false })) }} />);
    expect(screen.getByText("Tidak ada bagian yang diaktifkan.")).toBeTruthy();
  });

  it("applies theme variables and WhatsApp link", () => {
    render(<PrototypeRenderer config={{ ...sample, theme: { primary: "#123456", font: "Georgia, serif", radius: "8px" } }} />);
    const root = screen.getByTestId("prototype") as HTMLElement;
    expect(root.style.getPropertyValue("--prototype-primary")).toBe("#123456");
    expect(root.style.getPropertyValue("--prototype-font")).toBe("Georgia, serif");
    expect(root.style.getPropertyValue("--prototype-radius")).toBe("8px");
    expect(screen.getByRole("link", { name: /Hubungi via WhatsApp/ }).getAttribute("href")).toContain(`https://wa.me/${sample.whatsappNumber}`);
  });

  it("shows empty state for empty products", () => {
    render(<PrototypeRenderer config={{ ...sample, products: [] }} />);
    expect(screen.getByText("Belum ada produk yang ditampilkan.")).toBeTruthy();
  });

  it("rejects invalid config", () => {
    expect(() => render(<PrototypeRenderer config={{ ...sample, businessName: "" } as never} />)).toThrow();
  });
});

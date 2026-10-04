import { normalizeWhatsapp, WhatsappValidationError } from "../src/common/whatsapp";

describe("normalizeWhatsapp", () => {
  it.each([
    ["0812 3456 789", "628123456789"],
    ["+62 812-3456-789", "628123456789"],
    ["628123456789", "628123456789"],
    ["62-812-3456-789", "628123456789"],
    ["  0812.3456.789  ", "628123456789"],
    ["+628123456789", "628123456789"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeWhatsapp(input)).toBe(expected);
  });

  it("rejects empty input", () => {
    expect(() => normalizeWhatsapp("")).toThrow(WhatsappValidationError);
    expect(() => normalizeWhatsapp("   ")).toThrow(WhatsappValidationError);
  });

  it("rejects invalid numbers", () => {
    expect(() => normalizeWhatsapp("12345")).toThrow(WhatsappValidationError);
    expect(() => normalizeWhatsapp("08")).toThrow(WhatsappValidationError);
    expect(() => normalizeWhatsapp("628")).toThrow(WhatsappValidationError);
    expect(() => normalizeWhatsapp("not-a-number")).toThrow(WhatsappValidationError);
    expect(() => normalizeWhatsapp("6212345678")).toThrow(WhatsappValidationError);
  });
});

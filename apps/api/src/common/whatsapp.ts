export class WhatsappValidationError extends Error {}

export function normalizeWhatsapp(input: string): string {
  const digits = input.trim().replace(/\D/g, "");
  const normalized = digits.startsWith("08")
    ? `628${digits.slice(2)}`
    : digits.startsWith("62")
      ? digits
      : "";
  if (!/^628\d{7,13}$/.test(normalized)) {
    throw new WhatsappValidationError("whatsapp harus nomor Indonesia yang valid, contoh 628123456789");
  }
  return normalized;
}

import { validateTemplate, type TemplateDefinition } from "../template.js";

/**
 * Premium editorial storefront: quiet surfaces, oversized type, and a split hero.
 * It is intentionally category-agnostic so the catalog can surface it for food,
 * fashion, craft, and other product-led local brands.
 */
export const commerceEditorialTemplate: TemplateDefinition = {
  id: "commerce-editorial-v1",
  version: 1,
  categoryId: "kuliner",
  categories: ["fashion", "kerajinan", "agrikultur", "lainnya"],
  name: "Commerce Editorial",
  description: "Tampilan editorial yang hangat untuk brand lokal dengan produk unggulan dan cerita yang kuat.",
  /**
   * No thumbnail asset yet: the catalog card draws its cover from the real
   * theme colours instead of shipping a broken image path.
   */
  previewImage: null,
  tags: ["editorial", "premium", "catalog", "story-led"],
  pricePlan: "business",
  sortOrder: 10,
  active: true,
  presentation: {
    theme: {
      primary: "#264653",
      accent: "#E76F51",
      ink: "#19343e",
      muted: "#536b72",
      surface: "#fcfaf5",
      surfaceAlt: "#e9c46a",
      highlight: "#f4a261",
      onPrimary: "#fcfaf5",
      font: "Manrope, system-ui, sans-serif",
      displayFont: "Archivo, system-ui, sans-serif",
      radius: "1rem",
      buttonStyle: "soft",
      pattern: "arcs",
    },
    sections: [
      {
        key: "opening",
        type: "hero",
        variant: "split-image-right",
        enabled: true,
        content: {
          title: "tagline",
          subtitle: "description",
        },
      },
      {
        key: "proof",
        type: "about",
        variant: "story-block",
        enabled: true,
        content: {
          title: "businessName",
          body: "description",
          facts: "facts",
        },
      },
      {
        key: "selection",
        type: "productList",
        variant: "featured-product",
        enabled: true,
        content: {
          title: "products",
          note: "priceNote",
        },
        module: "catalog",
      },
      {
        key: "reasons",
        type: "feature",
        variant: "editorial-columns",
        enabled: true,
        content: {
          note: "description",
          items: "highlights",
        },
      },
      {
        key: "conversation",
        type: "whatsappCta",
        variant: "ink-panel",
        enabled: true,
        content: {
          body: "description",
        },
        module: "whatsapp",
      },
      {
        key: "closing",
        type: "footer",
        variant: "editorial",
        enabled: true,
        content: {
          text: "businessName",
        },
      },
    ],
  },
  contentSchema: {
    fields: [
      {
        id: "businessName",
        label: "Nama usaha",
        type: "text",
        bind: "businessName",
        required: true,
        placeholder: "Contoh: Kedai Rasa Pagi",
        help: "Nama yang akan tampil di halaman utama.",
        maxLength: 120,
        group: "Identitas",
      },
      {
        id: "tagline",
        label: "Kalimat pembuka",
        type: "text",
        bind: "tagline",
        required: false,
        placeholder: "Contoh: Sarapan hangat untuk hari yang lebih baik",
        maxLength: 140,
        group: "Identitas",
      },
      {
        id: "description",
        label: "Cerita singkat",
        type: "textarea",
        bind: "description",
        required: false,
        placeholder: "Ceritakan apa yang membuat usahamu berbeda.",
        maxLength: 2000,
        group: "Cerita",
      },
      {
        id: "whatsapp",
        label: "Nomor WhatsApp",
        type: "phone",
        bind: "whatsapp",
        required: false,
        placeholder: "0812...",
        maxLength: 30,
        group: "Kontak",
      },
      {
        id: "address",
        label: "Alamat atau area layanan",
        type: "address",
        bind: "address",
        required: false,
        placeholder: "Bandung, Jawa Barat",
        maxLength: 300,
        group: "Kontak",
      },
      {
        id: "hours",
        label: "Jam operasional",
        type: "text",
        bind: "hours",
        required: false,
        placeholder: "Senin–Sabtu, 07.00–17.00",
        maxLength: 200,
        group: "Kontak",
      },
      {
        id: "products",
        label: "Produk unggulan",
        type: "productList",
        bind: "products",
        required: false,
        maxItems: 12,
        group: "Katalog",
      },
      {
        id: "facts",
        label: "Hal yang ingin ditonjolkan",
        type: "factList",
        bind: "facts",
        required: false,
        maxItems: 6,
        group: "Cerita",
      },
      {
        id: "highlights",
        label: "Keunggulan utama",
        type: "featureList",
        bind: "highlights",
        required: false,
        maxItems: 6,
        group: "Cerita",
      },
    ],
    aiSlots: ["tagline", "description", "products"],
  },
  previewData: {
    businessName: "Kedai Rasa Pagi",
    tagline: "Rasa rumahan, diracik untuk pagi yang lebih baik.",
    description: "Kopi, roti, dan sarapan hangat yang dibuat segar setiap hari dari dapur kecil kami di Bandung.",
    whatsapp: "628123456789",
    address: "Bandung, Jawa Barat",
    hours: "Senin–Sabtu, 07.00–17.00",
    products: [
      { name: "Kopi susu gula aren", description: "Espresso, susu, dan gula aren lokal.", price: "Rp 18.000", badge: "Favorit" },
      { name: "Roti bakar srikaya", description: "Roti panggang dengan selai srikaya rumahan.", price: "Rp 15.000" },
      { name: "Nasi ayam suwir", description: "Nasi hangat, ayam suwir, dan sambal segar.", price: "Rp 25.000" },
    ],
    facts: [
      { label: "Diracik setiap hari", value: "Bahan segar" },
      { label: "Melayani sejak", value: "2019" },
      { label: "Pesan langsung", value: "WhatsApp" },
    ],
    highlights: [
      { title: "Bahan dibeli pagi hari", body: "Tidak disimpan semalaman, jadi rasa dan kualitasnya tetap terjaga." },
      { title: "Pesan sebelum berangkat", body: "Kirim pesan dulu, kami siapkan agar tidak menunggu lalu." },
      { title: "Bisa dikirim ke tempat", body: "Area Bandung dan sekitarnya, ongkir dihitung saat pesan." },
    ],
  },
  features: ["landing_page", "catalog", "whatsapp"],
  generator: {
    frontendPreset: "business-site-v1",
    backendPreset: "catalog-api-v1",
    modules: ["catalog", "whatsapp"],
  },
};

// Keep the fixture checked at module load so a catalog build can never ship a bad sample.
validateTemplate(commerceEditorialTemplate);

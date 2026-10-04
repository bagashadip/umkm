import type { CSSProperties, ReactNode } from "react";
import {
  prototypeConfigSchema,
  type PrototypeConfig,
  type PrototypeSection,
} from "@umkm/planner-engine";

type Product = PrototypeConfig["products"][number];
type Hero = Extract<PrototypeSection, { type: "hero" }>;
type About = Extract<PrototypeSection, { type: "about" }>;
type ProductList = Extract<PrototypeSection, { type: "productList" }>;
type Gallery = Extract<PrototypeSection, { type: "gallery" }>;
type Feature = Extract<PrototypeSection, { type: "feature" }>;
type Testimonial = Extract<PrototypeSection, { type: "testimonial" }>;
type Contact = Extract<PrototypeSection, { type: "contact" }>;
type WhatsAppCta = Extract<PrototypeSection, { type: "whatsappCta" }>;
type Payment = Extract<PrototypeSection, { type: "paymentInstruction" }>;
type Footer = Extract<PrototypeSection, { type: "footer" }>;

export type { PrototypeConfig, PrototypeSection };

/* ── Theme: every visual value comes from the template's tokens ── */

const THEME_DEFAULTS = {
  accent: "#e76f51",
  ink: "#19343e",
  muted: "#536b72",
  surface: "#fcfaf5",
  surfaceAlt: "#e9c46a",
  highlight: "#f4a261",
  onPrimary: "#fcfaf5",
  displayFont: "Archivo, system-ui, sans-serif",
  buttonStyle: "soft",
  pattern: "none",
};

function themeVars(theme: PrototypeConfig["theme"]): CSSProperties {
  return {
    "--prototype-primary": theme.primary,
    "--prototype-accent": theme.accent ?? THEME_DEFAULTS.accent,
    "--prototype-ink": theme.ink ?? THEME_DEFAULTS.ink,
    "--prototype-muted": theme.muted ?? THEME_DEFAULTS.muted,
    "--prototype-surface": theme.surface ?? THEME_DEFAULTS.surface,
    "--prototype-surface-alt": theme.surfaceAlt ?? THEME_DEFAULTS.surfaceAlt,
    "--prototype-highlight": theme.highlight ?? THEME_DEFAULTS.highlight,
    "--prototype-on-primary": theme.onPrimary ?? THEME_DEFAULTS.onPrimary,
    "--prototype-font": theme.font,
    "--prototype-display": theme.displayFont ?? THEME_DEFAULTS.displayFont,
    "--prototype-radius": theme.radius,
    "--prototype-btn": theme.buttonStyle ?? THEME_DEFAULTS.buttonStyle,
    "--prototype-pattern": theme.pattern ?? THEME_DEFAULTS.pattern,
  } as CSSProperties;
}

const variantClass = (type: string, variant?: string) =>
  `proto-${type}${variant && variant !== "default" ? ` proto-${type}--${variant}` : ""}`;

function whatsappHref(config: PrototypeConfig): string | null {
  const number = config.whatsappNumber.replace(/\D/g, "");
  // Too short to dial: rather than ship a link that cannot work, ship no CTA.
  if (number.length < 8) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(`Halo ${config.businessName}, saya ingin bertanya.`)}`;
}

function shouldRenderSection(section: PrototypeSection, config: PrototypeConfig): boolean {
  if (section.type === "whatsappCta") return whatsappHref(config) !== null;
  if (section.type === "gallery") return section.images.length > 0;
  return true;
}

/* ── Sections ─────────────────────────────────────────────────── */

/**
 * A composed colour panel stands in when the template has no hero image yet,
 * so a template never renders an empty or broken frame before photos exist.
 */
function ComposedPanel({ config }: { config: PrototypeConfig }) {
  const initials = config.businessName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <div className="proto-composed" aria-hidden="true">
      <span className="proto-composed-plate" />
      <span className="proto-composed-orb" />
      <span className="proto-composed-arc" />
      <span className="proto-composed-mark">{initials}</span>
      {config.businessType && <span className="proto-composed-caption">{config.businessType}</span>}
    </div>
  );
}

function Figure({ image, className }: { image?: { src: string; alt: string; caption?: string }; className?: string }) {
  if (!image) return null;
  return (
    <figure className={className ?? "proto-figure"}>
      <img src={image.src} alt={image.alt} loading="lazy" />
      {image.caption && <figcaption>{image.caption}</figcaption>}
    </figure>
  );
}

function Hero({ section, config }: { section: Hero; config: PrototypeConfig }) {
  const wa = whatsappHref(config);
  const href = section.ctaHref ?? wa ?? undefined;
  const actions = href ? (
    <div className="proto-actions">
      <a className="proto-btn proto-btn--primary" href={href} rel="noopener noreferrer">
        {section.ctaLabel ?? "Hubungi via WhatsApp"}
      </a>
      {section.secondaryHref && (
        <a className="proto-btn proto-btn--ghost" href={section.secondaryHref}>
          {section.secondaryLabel ?? "Lihat pilihan kami"}
        </a>
      )}
    </div>
  ) : null;

  const text = (
    <div className="proto-hero-text">
      {section.eyebrow && <p className="proto-eyebrow">{section.eyebrow}</p>}
      <h1 className="proto-hero-title">{section.title}</h1>
      <p className="proto-hero-lead">{section.subtitle}</p>
      {actions}
      {section.meta && section.meta.length > 0 && (
        <ul className="proto-meta">
          {section.meta.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );

  const figure = section.image ? (
    <Figure image={section.image} className="proto-figure proto-figure--hero" />
  ) : (
    <ComposedPanel config={config} />
  );

  return (
    <header className={variantClass("hero", section.variant)}>
      <div className="proto-shell proto-hero-inner">
        {section.variant === "split-image-left" ? (
          <>
            {figure}
            {text}
          </>
        ) : (
          <>
            {text}
            {figure}
          </>
        )}
      </div>
    </header>
  );
}

function About({ section }: { section: About }) {
  return (
    <section className={variantClass("about", section.variant)} aria-labelledby="proto-about-title">
      <div className="proto-shell proto-about-inner">
        <div className="proto-about-head">
          <p className="proto-eyebrow">Cerita</p>
          <h2 id="proto-about-title" className="proto-title">
            {section.title}
          </h2>
        </div>
        <div className="proto-about-body">
          <p className="proto-prose">{section.body}</p>
          {section.image && <Figure image={section.image} />}
        </div>
        {section.facts && section.facts.length > 0 && (
          <dl className="proto-facts">
            {section.facts.map((fact) => (
              <div key={fact.label} className="proto-fact">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="proto-product-card">
      <div className="proto-product-plate" aria-hidden="true">
        {product.badge && <span className="proto-badge">{product.badge}</span>}
        {product.image ? <img src={product.image} alt={product.name} loading="lazy" /> : null}
      </div>
      <div className="proto-product-body">
        <h3 className="proto-product-name">{product.name}</h3>
        <p className="proto-product-desc">{product.description}</p>
        <p className="proto-product-price">{product.priceLabel}</p>
      </div>
    </article>
  );
}

function ProductList({ section, products }: { section: ProductList; products: Product[] }) {
  if (products.length === 0) {
    return (
      <section className={variantClass("productList", section.variant)} aria-labelledby="proto-products-title">
        <div className="proto-shell">
          <p className="proto-eyebrow">Katalog</p>
          <h2 id="proto-products-title" className="proto-title">
            {section.title}
          </h2>
          <p className="proto-empty">Belum ada produk yang ditampilkan.</p>
        </div>
      </section>
    );
  }

  const [featured, ...rest] = products;

  return (
    <section className={variantClass("productList", section.variant)} aria-labelledby="proto-products-title">
      <div className="proto-shell">
        <div className="proto-section-head">
          <div>
            <p className="proto-eyebrow">Katalog</p>
            <h2 id="proto-products-title" className="proto-title">
              {section.title}
            </h2>
          </div>
          {section.note && <p className="proto-section-note">{section.note}</p>}
        </div>

        <div className="proto-featured">
          <ProductCard product={featured} />
          <ol className="proto-rows">
            {rest.map((product, index) => (
              <li key={product.id} className="proto-row">
                <span className="proto-row-index">{String(index + 2).padStart(2, "0")}</span>
                <div className="proto-row-main">
                  <h3 className="proto-row-name">{product.name}</h3>
                  <p className="proto-row-desc">{product.description}</p>
                </div>
                <span className="proto-row-price">{product.priceLabel}</span>
              </li>
            ))}
            {rest.length === 0 && (
              <li className="proto-row proto-row--note">
                <span className="proto-row-main">Lebih banyak pilihan menyusul.</span>
              </li>
            )}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Gallery({ section }: { section: Gallery }) {
  if (!section.images.length) return null;
  return (
    <section className={variantClass("gallery", section.variant)} aria-labelledby="proto-gallery-title">
      <div className="proto-shell">
        <p className="proto-eyebrow">Galeri</p>
        <h2 id="proto-gallery-title" className="proto-title">
          {section.title}
        </h2>
        <ul className="proto-gallery-grid">
          {section.images.map((image, index) => (
            <li key={`${image.src}-${index}`} className={`proto-gallery-item proto-gallery-item--${index % 5}`}>
              <img src={image.src} alt={image.alt} loading="lazy" />
              {image.caption && <span>{image.caption}</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Feature({ section }: { section: Feature }) {
  return (
    <section className={variantClass("feature", section.variant)} aria-labelledby="proto-feature-title">
      <div className="proto-shell">
        <div className="proto-section-head">
          <div>
            <p className="proto-eyebrow proto-eyebrow--coral">Keunggulan</p>
            <h2 id="proto-feature-title" className="proto-title">
              {section.title}
            </h2>
          </div>
          {section.note && <p className="proto-section-note">{section.note}</p>}
        </div>
        <ul className="proto-features">
          {section.items.map((item, index) => (
            <li key={`${item.title}-${index}`} className="proto-feature-item">
              <span className="proto-feature-rule" aria-hidden="true" />
              <h3 className="proto-feature-title">{item.title}</h3>
              <p className="proto-feature-body">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Testimonial({ section }: { section: Testimonial }) {
  return (
    <section className={variantClass("testimonial", section.variant)} aria-labelledby="proto-testimonial-title">
      <div className="proto-shell">
        <p className="proto-eyebrow">Testimoni</p>
        <h2 id="proto-testimonial-title" className="proto-title">
          {section.title}
        </h2>
        <div className="proto-quotes">
          {section.items.map((item, index) => (
            <blockquote key={`${item.name}-${index}`} className="proto-quote">
              <p>“{item.quote}”</p>
              <footer>
                <strong>{item.name}</strong>
                {item.role && <span>{item.role}</span>}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ section }: { section: Contact }) {
  return (
    <section className={variantClass("contact", section.variant)} aria-labelledby="proto-contact-title">
      <div className="proto-shell proto-contact-inner">
        <div>
          <p className="proto-eyebrow proto-eyebrow--coral">Kontak</p>
          <h2 id="proto-contact-title" className="proto-title">
            {section.title}
          </h2>
          {section.body && <p className="proto-prose">{section.body}</p>}
        </div>
        <dl className="proto-facts proto-facts--contact">
          {section.address && (
            <div className="proto-fact">
              <dt>Alamat</dt>
              <dd>{section.address}</dd>
            </div>
          )}
          {section.hours && (
            <div className="proto-fact">
              <dt>Jam buka</dt>
              <dd>{section.hours}</dd>
            </div>
          )}
          {section.phone && (
            <div className="proto-fact">
              <dt>Telepon / WhatsApp</dt>
              <dd>{section.phone}</dd>
            </div>
          )}
        </dl>
        {section.mapHref && (
          <a className="proto-btn proto-btn--primary" href={section.mapHref} rel="noopener noreferrer">
            Lihat di peta
          </a>
        )}
      </div>
    </section>
  );
}

function WhatsAppCta({ section, config }: { section: WhatsAppCta; config: PrototypeConfig }) {
  const wa = whatsappHref(config);
  if (!wa) return null;
  return (
    <section className={variantClass("whatsappCta", section.variant)} aria-labelledby="proto-wa-title">
      <div className="proto-shell proto-wa-inner">
        <div>
          <p className="proto-eyebrow proto-eyebrow--accent">Hubungi</p>
          <h2 id="proto-wa-title" className="proto-title">
            {section.title}
          </h2>
          <p className="proto-wa-lead">{section.body}</p>
        </div>
        <a className="proto-btn proto-btn--accent" href={wa} rel="noopener noreferrer">
          {section.buttonLabel ?? `Chat ${config.businessName}`}
        </a>
      </div>
    </section>
  );
}

function PaymentInstruction({ section }: { section: Payment }) {
  return (
    <section className={variantClass("paymentInstruction", section.variant)} aria-labelledby="proto-payment-title">
      <div className="proto-shell proto-payment-inner">
        <h2 id="proto-payment-title" className="proto-title">
          {section.title}
        </h2>
        <p className="proto-prose">{section.body}</p>
      </div>
    </section>
  );
}

function Footer({ section, config }: { section: Footer; config: PrototypeConfig }) {
  const wa = whatsappHref(config);
  return (
    <footer className={variantClass("footer", section.variant)}>
      <div className="proto-shell proto-footer-inner">
        <div>
          <p className="proto-footer-name">{config.businessName}</p>
          <p className="proto-footer-text">{section.text}</p>
        </div>
        <nav className="proto-footer-links" aria-label="Tautan kaki halaman">
          {section.links?.map((link) => (
            <a key={link.href} href={link.href} rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
          {wa && !section.links?.length && <a href={wa}>WhatsApp</a>}
        </nav>
        <p className="proto-footer-seo">{config.seo.title}</p>
      </div>
    </footer>
  );
}

/* ── Renderer ─────────────────────────────────────────────────── */

const renderers: { [K in PrototypeSection["type"]]: (args: never) => ReactNode } = {
  hero: Hero, about: About, productList: ProductList, gallery: Gallery,
  feature: Feature, testimonial: Testimonial, contact: Contact,
  whatsappCta: WhatsAppCta, paymentInstruction: PaymentInstruction, footer: Footer,
} as never;

export function PrototypeRenderer({ config }: { config: PrototypeConfig }) {
  const parsed = prototypeConfigSchema.parse(config);
  const wa = whatsappHref(parsed);

  const content = parsed.sections
    .filter((section) => section.enabled && shouldRenderSection(section, parsed))
    .map((section, index) => {
      const Renderer = renderers[section.type] as (args: {
        section: never;
        config: PrototypeConfig;
        products: Product[];
      }) => ReactNode;
      return (
        <Renderer
          key={`${section.type}-${index}`}
          section={section as never}
          config={parsed}
          products={parsed.products}
        />
      );
    });

  return (
    <div className="proto-root" data-testid="prototype" style={themeVars(parsed.theme)}>
      <style>{stylesheet(wa ? "true" : "false")}</style>
      {content.length === 0 ? (
        <p className="proto-empty-state">Tidak ada bagian yang diaktifkan.</p>
      ) : (
        content
      )}
    </div>
  );
}

/* ── Stylesheet: scoped to .proto-root, driven by theme tokens ─── */

function stylesheet(hasWhatsapp: string): string {
  return `
.proto-root{--pad:clamp(1.25rem,5vw,2.5rem);--rhythm:clamp(3.5rem,8vw,7rem);--max:72rem;
display:block;background:var(--prototype-surface);color:var(--prototype-ink);
font-family:var(--prototype-font),system-ui,sans-serif;line-height:1.6;
-webkit-font-smoothing:antialiased;overflow:hidden}
.proto-root *,.proto-root *::before,.proto-root *::after{box-sizing:border-box}
.proto-root h1,.proto-root h2,.proto-root h3{font-family:var(--prototype-display),var(--prototype-font),system-ui,sans-serif;
letter-spacing:-0.03em;line-height:0.98;margin:0;text-wrap:balance}
.proto-root p,.proto-root li,.proto-root dl,.proto-root dd,.proto-root figure{margin:0}
.proto-root ul,.proto-root ol{list-style:none;padding:0}
.proto-root a{color:inherit;text-decoration:none}
.proto-root img{display:block;width:100%;height:100%;object-fit:cover}
.proto-root :focus-visible{outline:3px solid var(--prototype-accent);outline-offset:3px}
.proto-shell{width:100%;max-width:var(--max);margin-inline:auto;padding-inline:var(--pad)}

.proto-title{font-size:clamp(1.75rem,4vw,2.75rem);color:var(--prototype-primary)}
.proto-eyebrow{font-size:0.6875rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;
color:var(--prototype-accent);margin-bottom:0.75rem}
.proto-eyebrow--sand{color:var(--prototype-highlight)}
.proto-prose{font-size:1.0625rem;line-height:1.75;color:var(--prototype-muted);max-width:62ch}
.proto-section-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:1rem 2rem}
.proto-section-note{font-size:0.9375rem;color:var(--prototype-muted);max-width:34ch}
.proto-empty{margin-top:1.5rem;padding:2.5rem 0;color:var(--prototype-muted);text-align:center;
border-top:1px solid color-mix(in oklab,var(--prototype-primary) 14%,transparent);
border-bottom:1px solid color-mix(in oklab,var(--prototype-primary) 14%,transparent)}
.proto-empty-state{padding:clamp(3rem,8vw,5rem) var(--pad);text-align:center;color:var(--prototype-muted)}

.proto-btn{display:inline-flex;align-items:center;justify-content:center;min-height:3.125rem;
padding:0.75rem 1.75rem;font-weight:700;font-size:1rem;letter-spacing:-0.01em;
border-radius:var(--prototype-btn,var(--prototype-radius));transition:transform .18s cubic-bezier(.16,1,.3,1),background-color .18s ease,color .18s ease}
.proto-btn:hover{transform:translateY(-2px)}
.proto-btn--primary{background:var(--prototype-surface-alt);color:var(--prototype-primary)}
.proto-btn--primary:hover{background:var(--prototype-highlight)}
.proto-btn--ghost{box-shadow:inset 0 0 0 1.5px color-mix(in oklab,var(--prototype-on-primary) 55%,transparent);color:var(--prototype-on-primary)}
.proto-btn--ghost:hover{background:color-mix(in oklab,var(--prototype-on-primary) 14%,transparent)}
.proto-btn--accent{background:var(--prototype-accent);color:#fff}
.proto-btn--accent:hover{background:color-mix(in oklab,var(--prototype-accent) 86%,#000)}
.proto-actions{display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:2rem}

/* ── Hero ─────────────────────────────────────────────────────── */
.proto-hero{position:relative;background:var(--prototype-primary);color:var(--prototype-on-primary);
padding-block:clamp(4rem,9vw,7.5rem);isolation:isolate}
.proto-hero::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;
background:radial-gradient(120% 90% at 88% 12%,color-mix(in oklab,var(--prototype-highlight) 34%,transparent),transparent 58%),
radial-gradient(90% 70% at 6% 96%,color-mix(in oklab,var(--prototype-accent) 26%,transparent),transparent 62%)}
.proto-hero-inner{display:grid;gap:clamp(2.5rem,5vw,4rem);align-items:center}
.proto-hero-title{font-size:clamp(2.25rem,6vw,4rem);max-width:15ch;color:var(--prototype-on-primary)}
.proto-hero-lead{margin-top:1.25rem;max-width:48ch;font-size:clamp(1rem,1.4vw,1.1875rem);
line-height:1.65;color:color-mix(in oklab,var(--prototype-on-primary) 84%,transparent)}
.proto-meta{display:flex;flex-wrap:wrap;gap:0.5rem 1.25rem;margin-top:2.25rem;
font-size:0.8125rem;font-weight:700;letter-spacing:0.04em;color:color-mix(in oklab,var(--prototype-on-primary) 72%,transparent)}
.proto-meta li{display:flex;align-items:center;gap:0.625rem}
.proto-meta li+li::before{content:"";width:1px;height:0.875rem;background:color-mix(in oklab,var(--prototype-on-primary) 35%,transparent)}

.proto-figure{position:relative;overflow:hidden;border-radius:var(--prototype-radius);
background:color-mix(in oklab,var(--prototype-primary) 92%,#000)}
.proto-figure--hero{aspect-ratio:4/5;box-shadow:0 2.5rem 5rem -2.5rem rgb(0 0 0 / .55)}
.proto-figure figcaption{position:absolute;left:0;right:0;bottom:0;padding:1rem 1.25rem;
font-size:0.8125rem;background:linear-gradient(transparent,rgb(0 0 0 / .62));color:#fff}

.proto-composed{position:relative;aspect-ratio:4/5;border-radius:var(--prototype-radius);
background:color-mix(in oklab,var(--prototype-on-primary) 8%,transparent);
overflow:hidden;box-shadow:0 2.5rem 5rem -2.5rem rgb(0 0 0 / .55)}
.proto-composed-plate{position:absolute;left:8%;top:14%;width:64%;height:56%;border-radius:calc(var(--prototype-radius) * 1.5);
background:var(--prototype-surface-alt);transform:rotate(-4deg)}
.proto-composed-orb{position:absolute;right:10%;bottom:12%;width:46%;aspect-ratio:1;border-radius:50%;
background:var(--prototype-accent);mix-blend-mode:normal;opacity:.94}
.proto-composed-arc{position:absolute;left:16%;bottom:8%;width:44%;aspect-ratio:1;border-radius:50%;
border:2px solid color-mix(in oklab,var(--prototype-on-primary) 55%,transparent)}
.proto-composed-mark{position:absolute;left:0;top:0;width:100%;height:100%;display:grid;place-items:center;
font-family:var(--prototype-display),var(--prototype-font),system-ui,sans-serif;font-size:clamp(3.5rem,9vw,6rem);
font-weight:700;letter-spacing:-0.05em;color:var(--prototype-primary)}
.proto-composed-caption{position:absolute;left:1.25rem;top:1.25rem;padding:0.4rem 0.85rem;border-radius:999px;
background:var(--prototype-primary);color:var(--prototype-on-primary);font-size:0.6875rem;font-weight:800;
letter-spacing:0.1em;text-transform:uppercase}

/* ── About ────────────────────────────────────────────────────── */
.proto-about{background:var(--prototype-surface);padding-block:var(--rhythm)}
.proto-about-inner{display:grid;gap:clamp(1.75rem,4vw,3rem)}
.proto-about-body .proto-figure{aspect-ratio:16/10;margin-top:1.5rem}
.proto-facts{display:grid;gap:1px;background:color-mix(in oklab,var(--prototype-primary) 16%,transparent);
border-block:1px solid color-mix(in oklab,var(--prototype-primary) 16%,transparent)}
.proto-fact{background:var(--prototype-surface);padding:1.125rem 0}
.proto-fact dt{font-size:0.6875rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--prototype-muted)}
.proto-fact dd{margin-top:0.375rem;font-family:var(--prototype-display),var(--prototype-font),system-ui,sans-serif;
font-size:1.125rem;font-weight:700;color:var(--prototype-primary)}
.proto-about--story-block .proto-about-head{max-width:24ch}

/* ── Products ─────────────────────────────────────────────────── */
.proto-productList{background:var(--prototype-surface-alt);color:var(--prototype-primary);
padding-block:var(--rhythm)}
.proto-productList .proto-eyebrow{color:color-mix(in oklab,var(--prototype-primary) 70%,transparent);filter:none}
.proto-productList .proto-title{color:var(--prototype-primary)}
.proto-productList .proto-section-note{color:color-mix(in oklab,var(--prototype-primary) 75%,transparent)}
.proto-featured{display:grid;gap:clamp(1.5rem,4vw,2.5rem);margin-top:clamp(2rem,5vw,3.5rem)}
.proto-product-card{background:var(--prototype-surface);border-radius:var(--prototype-radius);
overflow:hidden;box-shadow:0 2rem 4rem -2.5rem rgb(25 52 62 / .5)}
.proto-product-plate{position:relative;aspect-ratio:16/9;
background:linear-gradient(135deg,var(--prototype-primary),color-mix(in oklab,var(--prototype-primary) 62%,var(--prototype-highlight)))}
.proto-product-plate img{position:absolute;inset:0}
.proto-badge{position:absolute;left:1rem;top:1rem;z-index:1;padding:0.35rem 0.75rem;border-radius:999px;
background:var(--prototype-highlight);color:var(--prototype-primary);font-size:0.6875rem;font-weight:800;
letter-spacing:0.08em;text-transform:uppercase}
.proto-product-body{padding:1.5rem}
.proto-product-name{font-size:clamp(1.5rem,3vw,2rem);color:var(--prototype-primary)}
.proto-product-desc{margin-top:0.5rem;color:var(--prototype-muted);font-size:0.9375rem;line-height:1.6;max-width:52ch}
.proto-product-price{margin-top:1.125rem;font-size:1.375rem;font-weight:800;letter-spacing:-0.02em;color:var(--prototype-accent)}
.proto-rows{background:var(--prototype-surface);border-radius:var(--prototype-radius);padding:0.25rem 1.5rem}
.proto-row{display:grid;grid-template-columns:2.5rem 1fr;gap:0.75rem 1rem;align-items:baseline;
padding:1.375rem 0;border-bottom:1px solid color-mix(in oklab,var(--prototype-primary) 12%,transparent)}
.proto-row:last-child{border-bottom:0}
.proto-row-index{font-size:0.75rem;font-weight:800;letter-spacing:0.06em;color:var(--prototype-accent)}
.proto-row-name{font-size:1.125rem;color:var(--prototype-primary)}
.proto-row-desc{margin-top:0.25rem;font-size:0.9375rem;line-height:1.55;color:var(--prototype-muted);max-width:52ch}
.proto-row-price{grid-column:2;font-size:1rem;font-weight:800;color:var(--prototype-primary)}
.proto-row--note{color:var(--prototype-muted);font-size:0.9375rem}

.proto-productList--cards .proto-featured{grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))}
.proto-productList--cards .proto-rows{display:contents}
.proto-productList--cards .proto-row{grid-template-columns:1fr;padding:1.125rem 1.5rem;background:var(--prototype-surface)}
.proto-productList--cards .proto-row-index{display:none}
.proto-productList--cards .proto-row-price{grid-column:1}

/* ── Gallery ──────────────────────────────────────────────────── */
.proto-gallery{padding-block:var(--rhythm);background:var(--prototype-surface)}
.proto-gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:0.875rem;margin-top:2rem}
.proto-gallery-item{position:relative;overflow:hidden;border-radius:var(--prototype-radius);aspect-ratio:4/5;
background:color-mix(in oklab,var(--prototype-primary) 12%,transparent)}
.proto-gallery-item--1,.proto-gallery-item--4{aspect-ratio:4/3}
.proto-gallery-item span{position:absolute;left:0;right:0;bottom:0;padding:0.75rem 1rem;font-size:0.8125rem;
background:linear-gradient(transparent,rgb(0 0 0 / .6));color:#fff}
.proto-gallery-item+.proto-gallery-item{}

/* ── Feature ──────────────────────────────────────────────────── */
.proto-feature{background:var(--prototype-surface);padding-block:var(--rhythm)}
.proto-features{display:grid;gap:clamp(1.5rem,3vw,2rem);margin-top:clamp(2rem,4vw,3rem)}
.proto-feature-rule{display:block;width:2.5rem;height:3px;background:var(--prototype-accent);margin-bottom:1rem}
.proto-feature-title{font-size:1.25rem;color:var(--prototype-primary)}
.proto-feature-body{margin-top:0.5rem;font-size:0.9375rem;line-height:1.65;color:var(--prototype-muted)}

/* ── Testimonial ──────────────────────────────────────────────── */
.proto-testimonial{background:var(--prototype-surface);padding-block:var(--rhythm)}
.proto-quotes{display:grid;gap:1.25rem;margin-top:2.5rem}
.proto-quote{background:color-mix(in oklab,var(--prototype-surface-alt) 45%,var(--prototype-surface));
border-radius:var(--prototype-radius);padding:1.75rem}
.proto-quote p{font-family:var(--prototype-display),var(--prototype-font),system-ui,sans-serif;
font-size:1.25rem;line-height:1.35;letter-spacing:-0.02em;color:var(--prototype-primary);text-wrap:pretty}
.proto-quote footer{display:flex;flex-wrap:wrap;gap:0.375rem 0.625rem;margin-top:1.25rem;font-size:0.8125rem}
.proto-quote footer strong{font-weight:800}
.proto-quote footer span{color:var(--prototype-muted)}

/* ── Contact ──────────────────────────────────────────────────── */
.proto-contact{background:var(--prototype-surface);padding-block:var(--rhythm)}
.proto-contact-inner{display:grid;gap:2rem}
.proto-facts--contact{grid-template-columns:1fr}

/* ── WhatsApp CTA ─────────────────────────────────────────────── */
.proto-whatsappCta{background:var(--prototype-primary);color:var(--prototype-on-primary);padding-block:clamp(3rem,7vw,5.5rem)}
.proto-whatsappCta .proto-title{color:var(--prototype-on-primary);max-width:16ch}
.proto-wa-inner{display:grid;gap:1.75rem;align-items:center}
.proto-wa-lead{margin-top:1rem;max-width:52ch;line-height:1.7;color:color-mix(in oklab,var(--prototype-on-primary) 80%,transparent)}
.proto-whatsappCta--banner{background:var(--prototype-highlight);color:var(--prototype-primary)}
.proto-whatsappCta--banner .proto-title{color:var(--prototype-primary)}
.proto-whatsappCta--banner .proto-wa-lead{color:color-mix(in oklab,var(--prototype-primary) 78%,transparent)}
.proto-whatsappCta--banner .proto-btn--accent{background:var(--prototype-primary);color:var(--prototype-on-primary)}

/* ── Payment ──────────────────────────────────────────────────── */
.proto-paymentInstruction{background:var(--prototype-surface);padding-block:var(--rhythm)}
.proto-payment-inner{border-left:3px solid var(--prototype-accent);padding-left:1.5rem;max-width:60ch}

/* ── Footer ───────────────────────────────────────────────────── */
.proto-footer{background:var(--prototype-primary);color:var(--prototype-on-primary);padding-block:clamp(2.5rem,5vw,3.5rem)}
.proto-footer-inner{display:grid;gap:1.5rem}
.proto-footer-name{font-family:var(--prototype-display),var(--prototype-font),system-ui,sans-serif;
font-size:1.375rem;font-weight:700;letter-spacing:-0.03em}
.proto-footer-text{margin-top:0.375rem;font-size:0.9375rem;color:color-mix(in oklab,var(--prototype-on-primary) 70%,transparent)}
.proto-footer-links{display:flex;flex-wrap:wrap;gap:0.75rem 1.5rem;font-size:0.9375rem;font-weight:700}
.proto-footer-links a:hover{color:var(--prototype-surface-alt)}
.proto-footer-seo{font-size:0.8125rem;color:color-mix(in oklab,var(--prototype-on-primary) 55%,transparent)}

/* ── Composition ──────────────────────────────────────────────── */
@media (min-width:48rem){
  .proto-hero-inner{grid-template-columns:1.05fr 0.95fr}
  .proto-hero--split-image-left .proto-hero-text{order:2}
  .proto-hero--split-image-left .proto-figure,.proto-hero--split-image-left .proto-composed{order:1}
  .proto-about-inner{grid-template-columns:0.8fr 1.2fr}
  .proto-about-head{grid-row:span 2}
  .proto-facts{grid-template-columns:repeat(auto-fit,minmax(9rem,1fr))}
  .proto-featured{grid-template-columns:1.1fr 0.9fr;align-items:start}
  .proto-features{grid-template-columns:repeat(3,1fr)}
  .proto-quotes{grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))}
  .proto-contact-inner{grid-template-columns:1.1fr 0.9fr;align-items:start}
  .proto-wa-inner{grid-template-columns:1fr auto}
  .proto-footer-inner{grid-template-columns:1.2fr auto;align-items:center}
  .proto-footer-seo{grid-column:1/-1;border-top:1px solid color-mix(in oklab,var(--prototype-on-primary) 18%,transparent);padding-top:1.25rem}
  .proto-hero--full-image .proto-hero-text{position:relative;z-index:1}
  .proto-hero--full-image .proto-hero-inner{position:relative}
  .proto-hero--full-image .proto-composed,.proto-hero--full-image .proto-figure{position:absolute;inset:0 0 0 auto;width:56%;aspect-ratio:auto;opacity:.42}
  .proto-hero--full-image .proto-hero-text{max-width:60ch}
}
@media (min-width:64rem){
  .proto-features{grid-template-columns:repeat(3,1fr)}
  .proto-gallery-grid{grid-template-columns:repeat(6,1fr)}
  .proto-gallery-item--0{grid-column:span 4;aspect-ratio:16/10}
  .proto-gallery-item--1{grid-column:span 2}
  .proto-gallery-item--2{grid-column:span 2}
  .proto-gallery-item--3{grid-column:span 2}
  .proto-gallery-item--4{grid-column:span 2}
}
@media (prefers-reduced-motion:reduce){
  .proto-root *{transition-duration:.001ms!important}
}`;
}

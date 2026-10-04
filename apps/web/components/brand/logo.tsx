import Link from "next/link";

export function RakitwebLogo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={`rakitweb-logo${compact ? " rakitweb-logo-compact" : ""}`} aria-label="Rakitweb — beranda">
      <span className="rakitweb-logo-mark" aria-hidden="true">
        <span className="rakitweb-logo-layer rakitweb-logo-layer-back" />
        <span className="rakitweb-logo-layer rakitweb-logo-layer-front" />
      </span>
      <span className="rakitweb-logo-word">rakitweb</span>
    </Link>
  );
}

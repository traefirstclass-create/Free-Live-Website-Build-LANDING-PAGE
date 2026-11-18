import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-gold-400">{children}</p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  id,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14" data-reveal>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="font-serif text-3xl font-semibold leading-tight text-cream sm:text-5xl">
        {title}
      </h2>
      {intro && <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{intro}</p>}
    </div>
  );
}

export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-flex size-2.5 ${className}`} aria-hidden="true">
      <span className="absolute inline-flex size-full animate-live-ping rounded-full bg-alert" />
      <span className="relative inline-flex size-2.5 rounded-full bg-alert" />
    </span>
  );
}

export function GoldButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 text-base font-semibold text-ink shadow-[0_10px_40px_-10px_rgb(224_187_99/0.55)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300 ${className}`}
    >
      {children}
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </a>
  );
}

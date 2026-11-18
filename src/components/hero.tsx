import Link from "next/link";
import { GoldButton, LiveDot } from "./ui";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <header className="relative isolate overflow-hidden">
      {/* Ambient gold glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(224_187_99/0.22),transparent_70%),radial-gradient(40%_40%_at_85%_30%,rgb(201_154_60/0.12),transparent_70%)]"
      />
      <div aria-hidden="true" className="gold-hairline absolute inset-x-0 bottom-0" />

      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8" aria-label="Primary">
        <Link href="/" className="font-serif text-lg font-semibold tracking-wide">
          <span className="text-gold">{site.brand}</span>
        </Link>
        <a
          href="#apply"
          className="rounded-full border border-gold-400/40 px-4 py-2 text-sm font-medium text-gold-300 transition hover:border-gold-300 hover:text-gold-100"
        >
          Apply
        </a>
      </nav>

      <div className="mx-auto max-w-4xl px-5 pb-20 pt-10 text-center sm:px-8 sm:pb-28 sm:pt-16">
        <p className="inline-flex animate-fade-in items-center gap-2.5 rounded-full border border-alert/40 bg-alert/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cream">
          <LiveDot />
          Live on TikTok
        </p>

        <h1 className="mt-7 animate-fade-up font-serif text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          Watch Your Website Get Built.{" "}
          <span className="text-gold italic">Live. Free.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-muted [animation-delay:120ms] sm:text-xl">
          I design your one-page business website live on stream or privately, in about 15 minutes.{" "}
          <span className="text-cream">Love it? Keep it for $300.</span> Not for you? You owe nothing.
        </p>

        <div className="mt-9 flex animate-fade-up flex-col items-center gap-4 [animation-delay:220ms]">
          <GoldButton href="#apply" className="w-full sm:w-auto">
            Apply For a Live Build
          </GoldButton>
          <p
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-muted"
            aria-label="Live on TikTok, or private builds available"
          >
            <span className="inline-flex items-center gap-1.5 text-cream">
              <LiveDot className="scale-75" /> Live on TikTok
            </span>
            <span aria-hidden="true" className="text-gold-500">•</span>
            <span>Or Private Builds Available</span>
          </p>
        </div>
      </div>
    </header>
  );
}

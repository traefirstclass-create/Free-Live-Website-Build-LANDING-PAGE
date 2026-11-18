import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: "Plain-language terms for the Free Live Website Build: free preview builds (live or private), $300 to keep and launch.",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    h: "1. Two ways to build: live or private",
    p: [
      "If your application is accepted, I'll design a one-page website preview for your business either live on stream (for example on TikTok) or privately off-live, based on the build format you choose. Everything in these terms applies equally to live and private builds.",
    ],
  },
  {
    h: "2. The preview build is free",
    p: [
      "Whether it's built live or privately, the preview build costs nothing. You are not charged for applying, for being selected, or for the build itself.",
    ],
  },
  {
    h: "3. Keeping your site costs $300",
    p: [
      `If you love your site and want to keep it, the price to keep it and launch it on your domain is ${site.price.keep} for a one-page site. Multi-page sites start from ${site.price.multiPage} and are quoted separately.`,
      "Domain registration, paid email or other third-party services are not included unless agreed in writing.",
    ],
  },
  {
    h: "4. The site stays on a preview link until it's paid for",
    p: [
      "Until you purchase it, your site stays on my preview link. It won't be launched on your domain or transferred to you until payment is received. I may take preview links down after a reasonable period if the site isn't purchased.",
    ],
  },
  {
    h: "5. No obligation to buy",
    p: [
      "You are never obligated to buy. If the site isn't for you, you owe nothing, for both live and private builds.",
    ],
  },
  {
    h: "6. Consent to appear on stream and in replays (live builds only)",
    p: [
      "If you choose “Live on stream” or “Either works”, you agree that your business name, logo, photos, services, prices and the website being built may be shown on the live stream and in replays, clips and promotional posts, whether or not you buy the site.",
      "If you choose “Off-live (private build)”, your build won't be streamed. I may ask your permission separately before sharing any part of a private build publicly.",
    ],
  },
  {
    h: "7. Your content",
    p: [
      "You confirm you own or have permission to use the logo, photos and other materials you submit, and you give me permission to use them to design your preview. Don't submit anything you don't have the rights to.",
    ],
  },
  {
    h: "8. Availability during your build",
    p: ["You agree to be available by DM during your build so I can ask quick questions."],
  },
  {
    h: "9. The right to decline",
    p: [
      "I review every application and may decline, postpone or cancel any application or build at my discretion, including applications that don't meet the eligibility criteria (operating 3+ months and currently generating income).",
    ],
  },
  {
    h: "10. Changes",
    p: ["These terms may be updated from time to time. The version on this page at the time you apply applies to your build."],
  },
];

export default function TermsPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <Link href="/" className="text-sm text-gold-300 hover:text-gold-100">
        ← Back to {site.name}
      </Link>
      <h1 className="mt-6 font-serif text-4xl font-semibold sm:text-5xl">
        Terms, in <span className="text-gold italic">plain language</span>
      </h1>
      <p className="mt-4 text-muted">
        These terms cover the {site.name} program run by {site.brand}, for both live and private builds.
      </p>

      <div className="glass mt-8 rounded-2xl border-alert/30 p-5 text-sm leading-relaxed text-cream">
        <strong className="text-gold-300">Note:</strong> These terms are a plain-language summary provided for transparency and
        should be reviewed by a qualified legal professional before being relied on.
      </div>

      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-serif text-2xl font-semibold">{s.h}</h2>
            {s.p.map((t) => (
              <p key={t} className="mt-3 leading-relaxed text-muted">
                {t}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}

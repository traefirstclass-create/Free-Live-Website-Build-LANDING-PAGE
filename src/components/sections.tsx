import { SectionHeading } from "./ui";
import { site } from "@/lib/site";

const steps = [
  {
    n: "01",
    title: "Apply & qualify",
    body: "Fill out the short application below with your business details, logo and photos. Pick a live or private build.",
  },
  {
    n: "02",
    title: "Get built — live or private",
    body: "I design your one-page site in about 15 minutes, live on stream for everyone to watch, or privately off-live if you prefer.",
  },
  {
    n: "03",
    title: "Love it? Own it for $300",
    body: "If you love it, keep it and I'll launch it on your domain for $300. If not, walk away. You owe nothing.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeading id="how-title" eyebrow="How it works" title={<>Three steps. <span className="text-gold italic">Zero risk.</span></>} />
      <ol className="grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s.n}
            data-reveal
            style={{ "--reveal-delay": `${i * 100}ms` } as React.CSSProperties}
            className="glass rounded-3xl p-7"
          >
            <span className="font-serif text-4xl font-semibold text-gold">{s.n}</span>
            <h3 className="mt-4 font-serif text-2xl font-semibold">{s.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const criteria = [
  { title: "Operating 3+ months", body: "You've been actively running your business for at least three months." },
  { title: "Generating income", body: "You're already making sales or booking paying clients." },
  { title: "Ready to invest", body: "If you love the result, you're ready to invest $300 to keep and launch it." },
];

export function WhoQualifies() {
  return (
    <section aria-labelledby="who-title" className="relative px-5 py-20 sm:px-8 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_50%,rgb(201_154_60/0.08),transparent_70%)]" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="who-title"
          eyebrow="Who qualifies"
          title="Built for real, running businesses"
          intro="Builds are reserved for established businesses that are ready to grow online."
        />
        <ul className="grid gap-5 md:grid-cols-3">
          {criteria.map((c, i) => (
            <li
              key={c.title}
              data-reveal
              style={{ "--reveal-delay": `${i * 100}ms` } as React.CSSProperties}
              className="glass flex gap-4 rounded-3xl p-7"
            >
              <span aria-hidden="true" className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-ink">
                ✓
              </span>
              <div>
                <h3 className="font-serif text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Pricing() {
  const rows = [
    { label: "Preview build (live or private)", price: "Free", highlight: false },
    { label: "Keep & launch your one-page site", price: site.price.keep, highlight: true },
    { label: "Multi-page sites", price: `from ${site.price.multiPage}`, highlight: false },
  ];
  return (
    <section aria-labelledby="pricing-title" className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeading id="pricing-title" eyebrow="Pricing" title="Transparent. No surprises." />
      <div data-reveal className="glass overflow-hidden rounded-3xl">
        <dl className="divide-y divide-white/10">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 px-6 py-5 sm:px-8 sm:py-6">
              <dt className="text-base text-cream sm:text-lg">{r.label}</dt>
              <dd className={`shrink-0 font-serif text-2xl font-semibold sm:text-3xl ${r.highlight ? "text-gold" : "text-cream"}`}>
                {r.price}
              </dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-gold-400/20 bg-gold-400/[0.06] px-6 py-5 text-sm leading-relaxed text-gold-100 sm:px-8">
          The site stays on my preview link until purchased. No payment is required unless you choose to keep it.
          This applies to both live and private builds.
        </p>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "Is the build really free?",
    a: "Yes. The preview build is free, whether it happens live on stream or privately. You only pay $300 if you love it and want to keep it and launch it on your domain.",
  },
  {
    q: "What's the difference between a live and a private build?",
    a: "A live build happens on stream (TikTok), and your business is featured in the live and in replays. A private build happens off-live; I'll reach out to schedule it and send you a preview link when it's ready. Same quality, same pricing.",
  },
  {
    q: "What if I don't like it?",
    a: "Then you owe nothing. The site stays on my preview link and is never launched on your domain unless you purchase it.",
  },
  {
    q: "What do I need to provide?",
    a: "Your logo, 3–6 photos, your services or products with prices, and your brand colours (or let me pick). An inspiration site helps too.",
  },
  {
    q: "Do I need a domain already?",
    a: "No. If you decide to keep your site, I'll help you connect an existing domain or get a new one.",
  },
  {
    q: "What if I need more than one page?",
    a: "Multi-page sites start from $500. Mention it in your application and we can talk after your preview.",
  },
  {
    q: "Is everyone accepted?",
    a: "No. Builds are reserved for businesses operating 3+ months that are already generating income. I review every application and may decline any of them.",
  },
];

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeading id="faq-title" eyebrow="FAQ" title="Questions, answered" />
      <div className="space-y-3">
        {faqs.map((f) => (
          <details key={f.q} data-reveal className="glass group rounded-2xl px-6 py-1 open:pb-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-cream outline-none focus-visible:text-gold-300 [&::-webkit-details-marker]:hidden">
              {f.q}
              <span aria-hidden="true" className="text-xl text-gold-400 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-serif text-xl font-semibold text-gold">{site.brand}</p>
          <p className="mt-1 text-sm text-muted">© {site.brand}. All rights reserved.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          {site.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-muted transition hover:text-gold-300">
              {s.label}
            </a>
          ))}
          <a href="/terms" className="text-muted transition hover:text-gold-300">
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}

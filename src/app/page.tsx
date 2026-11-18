import { Hero } from "@/components/hero";
import { Faq, Footer, HowItWorks, Pricing, WhoQualifies } from "@/components/sections";
import { ApplicationForm } from "@/components/application-form";
import { RevealObserver } from "@/components/reveal-observer";
import { SectionHeading } from "@/components/ui";

export default function Home() {
  return (
    <>
      <RevealObserver />
      <Hero />
      <main id="main">
        <HowItWorks />
        <WhoQualifies />
        <Pricing />

        <section id="apply" aria-labelledby="apply-title" className="scroll-mt-4 px-5 py-20 sm:px-8 sm:py-28">
          <SectionHeading
            id="apply-title"
            eyebrow="Apply"
            title={<>Apply for your <span className="text-gold italic">free build</span></>}
            intro="Takes about 4 minutes. Have your logo and 3–6 photos ready."
          />
          <div className="glass mx-auto max-w-2xl rounded-3xl p-6 sm:p-10">
            <ApplicationForm />
          </div>
        </section>

        <Faq />
      </main>
      <Footer />
    </>
  );
}

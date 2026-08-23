import { FinalCta } from "@/components/final-cta";
import { Gallery } from "@/components/gallery";
import { Hero } from "@/components/hero";
import { NoirAiSection } from "@/components/noir-ai/noir-ai-section";
import { NoirStandard } from "@/components/noir-standard";
import { Process } from "@/components/process";
import { ScrollScrubVideo } from "@/components/scroll-scrub-video";
import { Services } from "@/components/services";
import { SiteNav } from "@/components/site-nav";
import { WhyNoir } from "@/components/why-noir";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <ScrollScrubVideo />
        <NoirStandard />
        <Services />
        <Process />
        <Gallery />
        <WhyNoir />
        <FinalCta />
        <NoirAiSection />
      </main>
    </>
  );
}

import { GridBackground } from "@/components/grid-background";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { BelieverEconomySection } from "@/components/landing/believer-economy-section";
import { FeaturedCommitmentsSection } from "@/components/landing/featured-commitments-section";
import { FAQSection } from "@/components/landing/faq-section";

import { ActivityTicker } from "@/components/activity-ticker";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <GridBackground />
      <div className="relative z-10">
        <SiteHeader />

        <main className="mx-auto max-w-[1140px] px-4 pb-20 pt-10 sm:px-6 lg:px-8 space-y-32 sm:space-y-48">
          <HeroSection />
        </main>

        <ActivityTicker />

        <main className="mx-auto max-w-[1140px] px-4 pb-20 sm:px-6 lg:px-8 space-y-32 sm:space-y-48">
          <HowItWorksSection />
          <BelieverEconomySection />
          <FeaturedCommitmentsSection />
          <FAQSection />
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
"use client";

import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FAQSection() {
  return (
    <section className="mt-32 max-w-3xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="border-oath-border text-oath-muted-text">FAQ</Badge>
        <h2 className="text-4xl font-bold tracking-[-0.04em]">Common Questions</h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-oath-border">
          <AccordionTrigger className="text-left font-semibold">What happens to my SOL if I fail?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            If you fail to submit proof before the daily deadline, your principal stake is burned. 
            We use &quot;hard commitments&quot; to ensure maximum accountability. There are no refunds for broken oaths.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className="border-oath-border">
          <AccordionTrigger className="text-left font-semibold">Is the contract safe?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Yes. OATH uses Anchor-verified escrow vaults. Your funds are never held by our team; 
            they are locked in a program-derived address (PDA) controlled solely by the Solana program logic.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3" className="border-oath-border">
          <AccordionTrigger className="text-left font-semibold">How do believers earn yield?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Makers pay a 5% &quot;faith fee&quot; upon successful completion of their oath. 
            This fee is distributed among everyone who co-staked as a believer, proportional to their stake.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4" className="border-oath-border">
          <AccordionTrigger className="text-left font-semibold">What counts as valid proof?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            You can submit photos, Strava links, or text updates. Our AI coach performs the first layer 
            of verification, but your believers are the final jury. If they doubt you, they can mark your proof as suspicious.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
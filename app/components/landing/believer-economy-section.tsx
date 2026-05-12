"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function BelieverFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-oath-border bg-oath-black/10 p-6 transition-all hover:border-oath-gold/30 hover:bg-oath-black/20">
      <h4 className="text-lg font-black text-foreground flex items-center gap-3 uppercase tracking-tighter">
        <div className="h-2 w-2 rounded-full bg-oath-gold" />
        {title}
      </h4>
      <p className="mt-3 text-base text-muted-foreground/80 leading-relaxed">{description}</p>
    </div>
  );
}

export function BelieverEconomySection() {
  return (
    <section>
      <Card className="border-oath-border bg-oath-surface shadow-[0_32px_64px_rgba(0,0,0,0.2)] overflow-hidden rounded-[2rem]">
        <CardContent className="grid gap-0 p-0 lg:grid-cols-2">
          <div className="p-10 lg:p-20 space-y-8 bg-oath-surface flex flex-col justify-center">
            <Badge className="w-fit bg-oath-gold text-black font-black tracking-widest text-[10px] py-1 px-3">
              THE BELIEVER ECONOMY
            </Badge>
            <h2 className="text-4xl font-black tracking-[-0.05em] sm:text-6xl uppercase leading-[0.9]">
              Back someone <br />
              you believe in. <br />
              <span className="text-oath-gold italic">Earn together.</span>
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground border-l-2 border-oath-border pl-6">
              Don't just watch from the sidelines. Co-stake on makers you believe will win. 
              If they complete their oath, you share a portion of the faith fee. 
              Principal is always protected.
            </p>
            <Button
              asChild
              size="lg"
              className="w-fit rounded-xl bg-oath-black px-10 py-8 text-lg font-bold text-white hover:bg-oath-black/90 transition-all hover:scale-[1.05]"
            >
              <Link href="/explore">Explore Oaths to Back →</Link>
            </Button>
          </div>

          <div className="p-10 lg:p-20 grid gap-6 bg-oath-black/5 flex flex-col justify-center border-l border-oath-border">
            <BelieverFeature
              title="Principal Protected"
              description="Your SOL is returned to you regardless of whether the maker succeeds or fails."
            />
            <BelieverFeature
              title="Faith Fee Yield"
              description="Earn a share of the completion pool funded by the makers themselves."
            />
            <BelieverFeature
              title="Curate the Best"
              description="Your backing history becomes part of your own reputation as a high-signal believer."
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
"use client";

import { Badge } from "@/components/ui/badge";
import { PencilLine, Lock, UploadSimple, Trophy } from "@phosphor-icons/react/dist/ssr";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24">
      <div className="space-y-12">
        <div className="space-y-6 text-center">
          <Badge variant="outline" className="border-oath-border bg-oath-surface/80 text-[0.7rem] uppercase tracking-[0.4em] text-oath-muted-text px-5 py-2">
            THE MECHANICS
          </Badge>
          <h2 className="text-4xl font-extrabold tracking-[-0.04em] sm:text-7xl uppercase leading-[0.9]">
            The public market for <br />
            <span className="text-oath-gold italic">human follow-through.</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <HowItWorksStep
            index="01"
            title="Declare your oath"
            description="Set a clear, measurable goal and specify the duration. No vagueness allowed."
            icon={<PencilLine size={24} weight="duotone" />}
            highlighted={true}
          />
          <HowItWorksStep
            index="02"
            title="Stake the risk"
            description="Lock SOL into the Anchor escrow. It's your skin in the game, secured by code."
            icon={<Lock size={24} weight="duotone" />}
          />
          <HowItWorksStep
            index="03"
            title="Daily Proof"
            description="Submit screenshots or links every 24h. The network (and AI) validates your progress."
            icon={<UploadSimple size={24} weight="duotone" />}
          />
          <HowItWorksStep
            index="04"
            title="Claim or Burn"
            description="Complete the streak to reclaim your stake + rewards. Fail, and it's gone forever."
            icon={<Trophy size={24} weight="duotone" />}
          />
        </div>
      </div>
    </section>
  );
}

function HowItWorksStep({
  index,
  title,
  description,
  icon,
  highlighted = false,
}: {
  index: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div className={`group space-y-6 rounded-3xl border p-8 transition-all duration-500 ${
      highlighted 
        ? "border-oath-gold bg-oath-surface shadow-[0_20px_40px_rgba(223,255,0,0.1)] -translate-y-2" 
        : "border-oath-border bg-oath-surface/40 hover:border-oath-gold/50 hover:bg-oath-surface/80 hover:translate-y-[-4px]"
    }`}>
      <div className="flex items-center justify-between">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${
          highlighted ? "bg-oath-gold text-oath-black scale-110" : "bg-oath-black text-oath-gold group-hover:bg-oath-gold group-hover:text-oath-black"
        }`}>
          {icon}
        </div>
        <span className="text-3xl font-black tracking-tighter text-oath-black/5 group-hover:text-oath-black/10 transition-colors">{index}</span>
      </div>
      <div className="space-y-3">
        <h3 className="text-lg font-black uppercase tracking-wider text-foreground">{title}</h3>
        <p className="text-base leading-relaxed text-muted-foreground/80">{description}</p>
      </div>
    </div>
  );
}
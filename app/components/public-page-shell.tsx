import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ActivityTicker } from "./activity-ticker";

type PublicPageShellProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
};

export function PublicPageShell({
  eyebrow,
  title,
  description,
  children,
  actions,
}: PublicPageShellProps) {
  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-black selection:bg-oath-gold selection:text-black">
      {/* Subtle Light Grid Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(223,255,0,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
      </div>

      <div className="relative z-10">
        <SiteHeader />
        <ActivityTicker />

        <main className="mx-auto max-w-[1400px] px-6 sm:px-10 pb-24 pt-8 sm:pt-12">
          <section className="mb-8 sm:mb-14 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Badge
                variant="outline"
                className="border-black/5 bg-white px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-sm"
              >
                ◆ {eyebrow}
              </Badge>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-[5rem] font-black leading-[1] tracking-[-0.05em] uppercase">
                {title}
              </h1>
              <p className="max-w-xl text-sm sm:text-lg font-medium leading-relaxed text-black/40 border-l-3 border-oath-gold pl-5 py-1">
                {description}
              </p>
            </div>
          </section>

          <div className="relative">{children}</div>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

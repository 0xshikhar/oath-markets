import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { GridBackground } from "./grid-background";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <GridBackground />
      <div className="relative z-10">
        <SiteHeader />

        <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Badge
                variant="outline"
                className="border-oath-border bg-oath-surface/80 text-[0.68rem] uppercase tracking-[0.28em] text-oath-muted-text"
              >
                {eyebrow}
              </Badge>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                {description}
              </p>
            </div>
          </section>

          <div className="mt-10">{children}</div>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

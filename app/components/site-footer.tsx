"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GithubLogo, TwitterLogo, DiscordLogo, ArrowSquareOut } from "@phosphor-icons/react";

const navSections = [
  {
    label: "Product",
    links: [
      { href: "/explore", label: "Explore" },
      { href: "/feed", label: "Proof Feed" },
      { href: "/create", label: "Make an Oath" },
      { href: "/dashboard", label: "My Dashboard" },
    ],
  },
  {
    label: "Ecosystem",
    links: [
      { href: "/#how-it-works", label: "How It Works" },
      { href: "#", label: "Built on Solana", external: true },
      { href: "#", label: "Anchor Program", external: true },
      { href: "#", label: "Reputation API", external: true },
    ],
  },
];

const socialLinks = [
  { href: "https://twitter.com", label: "Twitter", icon: TwitterLogo },
  { href: "https://github.com", label: "GitHub", icon: GithubLogo },
  { href: "https://discord.com", label: "Discord", icon: DiscordLogo },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 bg-background overflow-hidden">
      {/* Final CTA Block */}
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 lg:px-8">
        <div className="py-16 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              READY TO MAKE IT REAL?
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Stop keeping your goals private.
              The blockchain doesn&apos;t forget, and neither will you.
            </p>
            <div className="mt-10">
              <Button
                asChild
                size="lg"
                className="rounded-lg bg-oath-gold px-10 text-black hover:bg-oath-gold/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Link href="/create">Make Your First Oath →</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Thick Line */}
      <div className="border-t-2 border-oath-black w-full" />

      {/* Author Section / Brand Bar */}
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-10 lg:py-12">
          {/* Brand */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
              <Image
                src="/logo.png"
                alt="OATH"
                width={84}
                height={28}
                className="h-auto w-auto object-contain"
                priority
              />
            </Link>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
                Accountability infrastructure on Solana.
              </p>
              <p className="text-xs text-oath-muted-text/80">
                Your word, on-chain. Forever.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <span className="rounded-[2px] border border-oath-border bg-oath-surface px-3.5 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-oath-muted-text">
              Built on Solana
            </span>
            <Link
              href="/create"
              className="rounded-[2px] bg-oath-black px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-background transition-all hover:bg-oath-black/80 hover:shadow-lg"
            >
              Start an oath
            </Link>
          </div>
        </div>
      </div>

      {/* Full Width Thin Line */}
      <div className="border-t border-oath-border w-full" />

      {/* Middle bar — nav + social + advice */}
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 py-12 lg:grid-cols-[1fr_auto_auto_auto] lg:py-16">
          {/* Nav sections */}
          <div className="grid gap-8 sm:grid-cols-2 lg:flex lg:gap-20">
            {navSections.map((section) => (
              <div key={section.label} className="space-y-6">
                <p className="text-[0.65rem] uppercase tracking-[0.24em] text-oath-black font-bold">
                  {section.label}
                </p>
                <ul className="space-y-3.5">
                  {section.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <Link
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="group flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                        {link.external && (
                          <ArrowSquareOut
                            size={12}
                            className="opacity-0 transition-all group-hover:opacity-60 group-hover:translate-x-0.5"
                            weight="bold"
                          />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Social */}
          <div className="space-y-6 lg:border-l lg:border-oath-border lg:pl-12">
            <p className="text-[0.65rem] uppercase tracking-[0.24em] text-oath-black font-bold">
              Follow
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-11 items-center justify-center rounded-[2px] border border-oath-border bg-oath-surface text-oath-muted-text transition-all hover:border-oath-black hover:bg-oath-black hover:text-background hover:scale-110"
                  >
                    <Icon size={20} weight="regular" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Protocol status */}
          <div className="space-y-6 lg:border-l lg:border-oath-border lg:pl-12">
            <p className="text-[0.65rem] uppercase tracking-[0.24em] text-oath-black font-bold">
              Status
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="size-2 rounded-full bg-oath-green animate-pulse" />
                <span className="text-xs font-medium text-foreground/80">All systems operational</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="size-2 rounded-full bg-oath-muted-text/30" />
                <span className="text-xs text-muted-foreground">Devnet active</span>
              </div>
            </div>
          </div>

          {/* Advice Field */}
          {/* <div className="space-y-6 lg:border-l lg:border-oath-border lg:pl-12 max-w-[280px]">
            <p className="text-[0.65rem] uppercase tracking-[0.24em] text-oath-black font-bold">
              Improvement
            </p>
            <div className="space-y-4">
              <p className="text-[11px] leading-relaxed text-muted-foreground/90">
                Help us build the frontier of accountability. What should we add next?
              </p>
              <div className="flex flex-col gap-2.5">
                <Textarea
                  placeholder="Your advice..."
                  className="min-h-[90px] w-full resize-none rounded-[2px] border-oath-border bg-oath-surface/50 text-xs focus-visible:ring-oath-black focus-visible:bg-oath-surface transition-all"
                />
                <Button
                  size="sm"
                  className="w-full h-9 rounded-[2px] bg-oath-black text-[10px] uppercase tracking-[0.2em] text-background hover:bg-oath-black/90 transition-all active:scale-[0.98]"
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* Full Width Thin Line for Bottom Bar */}
      <div className="border-t border-oath-border w-full" />

      {/* Bottom bar */}
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-8">
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-oath-muted-text/80">
            © {new Date().getFullYear()} OATH · Accountability Infrastructure · Frontier 2026
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-[0.65rem] uppercase tracking-[0.16em] text-oath-muted-text transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-[0.65rem] uppercase tracking-[0.16em] text-oath-muted-text transition-colors hover:text-foreground"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
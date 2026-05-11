"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    <footer className="relative z-10 border-t-2 border-oath-black bg-background">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 lg:px-8">
        {/* Final CTA Block */}
        <div className="border-b border-oath-border py-10 lg:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              READY TO MAKE IT REAL?
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Stop keeping your goals private.
              The blockchain doesn&apos;t forget, and neither will you.
            </p>
            <div className="mt-6">
              <Button
                asChild
                className="rounded-lg bg-oath-gold text-black hover:bg-oath-gold/90"
              >
                <Link href="/create">Make Your First Oath →</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 border-b border-oath-border py-8 lg:py-10">
          {/* Brand */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Link href="/" className="shrink-0">
              <Image
                src="/logo.png"
                alt="OATH"
                width={72}
                height={24}
                className="h-auto w-auto object-contain"
                priority
              />
            </Link>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
                Accountability infrastructure on Solana.
              </p>
              <p className="text-xs text-oath-muted-text">
                Your word, on-chain. Forever.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <span className="rounded-[2px] border border-oath-border bg-oath-surface px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-oath-muted-text">
              Built on Solana
            </span>
            <Link
              href="/create"
              className="rounded-[2px] bg-oath-black px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-background transition-colors hover:bg-oath-black/80"
            >
              Start an oath
            </Link>
          </div>
        </div>

        {/* Middle bar — nav + social */}
        <div className="grid gap-8 py-8 lg:grid-cols-[1fr_auto_auto] lg:py-10">
          {/* Nav sections */}
          <div className="grid gap-8 sm:grid-cols-2 lg:flex lg:gap-16">
            {navSections.map((section) => (
              <div key={section.label} className="space-y-4">
                <p className="text-[0.65rem] uppercase tracking-[0.24em] text-oath-black font-medium">
                  {section.label}
                </p>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <Link
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                        {link.external && (
                          <ArrowSquareOut
                            size={12}
                            className="opacity-0 transition-opacity group-hover:opacity-60"
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

          {/* Social + status */}
          <div className="space-y-4 lg:border-l lg:border-oath-border lg:pl-10">
            <p className="text-[0.65rem] uppercase tracking-[0.24em] text-oath-black font-medium">
              Follow
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-9 items-center justify-center rounded-[2px] border border-oath-border bg-oath-surface text-oath-muted-text transition-all hover:border-oath-black hover:bg-oath-black hover:text-background"
                  >
                    <Icon size={15} weight="regular" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Protocol status */}
          <div className="space-y-4 lg:border-l lg:border-oath-border lg:pl-10">
            <p className="text-[0.65rem] uppercase tracking-[0.24em] text-oath-black font-medium">
              Status
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-oath-green" />
                <span className="text-xs text-muted-foreground">All systems operational</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-oath-muted-text" />
                <span className="text-xs text-muted-foreground">Devnet active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-oath-border py-5">
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-oath-muted-text">
            © {new Date().getFullYear()} OATH · Built on Solana · Frontier 2026
          </p>
          <div className="flex items-center gap-4">
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
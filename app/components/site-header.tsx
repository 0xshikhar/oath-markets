"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const WalletButton = dynamic(
  () => import("./wallet-button").then((mod) => mod.WalletButton),
  {
    ssr: false,
    loading: () => (
      <button className="flex h-10 items-center gap-2 rounded-[var(--radius)] border border-border bg-background px-3 text-sm font-medium text-foreground">
        <span className="h-2 w-2 rounded-full bg-oath-gold" />
        <span>Sign in</span>
      </button>
    ),
  }
);

const ThemeToggle = dynamic(
  () => import("./theme-toggle").then((mod) => mod.ThemeToggle),
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius)] border border-border bg-background text-sm transition hover:bg-muted"
        aria-label="Toggle theme"
      >
        <span className="size-4" />
      </button>
    ),
  }
);

const navItems = [
  { href: "/explore", label: "Explore" },
  { href: "/feed", label: "Arena" },
  { href: "/profile", label: "Profile" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 sm:h-20 max-w-[1140px] items-center justify-between gap-4 px-6 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="OATH logo"
            width={80}
            height={28}
            priority
            className="h-auto w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            asChild
            className="hidden rounded-[var(--radius)] bg-oath-black text-background hover:bg-oath-black/80 sm:inline-flex"
          >
            <Link href="/create">Start an Oath</Link>
          </Button>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
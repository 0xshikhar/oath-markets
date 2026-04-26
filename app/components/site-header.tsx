import Link from "next/link";
import { WalletButton } from "./wallet-button";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/explore", label: "Explore" },
  { href: "/create", label: "Create" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-oath-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-oath-border bg-oath-gold text-sm font-black text-black shadow-[0_12px_40px_-20px_rgba(245,166,35,0.8)]">
            O
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[0.7rem] font-semibold tracking-[0.28em] text-oath-muted-text">
              OATH
            </span>
            <span className="text-xs text-muted-foreground">
              Public stakes for follow-through
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
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
          <span className="hidden rounded-full border border-oath-border bg-oath-surface/70 px-3 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text lg:inline-flex">
            Frontier 2026
          </span>
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}

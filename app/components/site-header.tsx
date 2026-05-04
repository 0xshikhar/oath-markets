import Link from "next/link";
import { WalletButton } from "./wallet-button";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/explore", label: "Explore" },
  { href: "/feed", label: "Feed" },
  { href: "/create", label: "Create" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1140px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex flex-col leading-none">
            <span className="text-2xl font-black uppercase tracking-[-0.05em] text-foreground">
              OATH
            </span>
            <span className="text-[0.68rem] uppercase tracking-[0.28em] text-oath-muted-text">
              Public record
            </span>
          </span>
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
          <WalletButton />
        </div>
      </div>
    </header>
  );
}

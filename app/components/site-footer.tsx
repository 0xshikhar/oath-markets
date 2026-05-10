import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/feed", label: "Feed" },
  { href: "/create", label: "Create" },
  { href: "/dashboard", label: "Dashboard" },
  {
    href: "/u/9xF3J1mN4qT8pW2yR5bH7cK6dL8vN3sA1eR6tG2uM9Q4",
    label: "Profile",
  },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-background/70">
      <div className="mx-auto grid max-w-[1140px] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="OATH logo"
            width={60}
            height={20}
            className="h-auto w-auto object-contain"
          />
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Public commitment stakes on Solana. Built for Frontier, designed for
            follow-through, and shaped for shareable accountability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[var(--radius)] border border-oath-border bg-oath-surface/60 px-4 py-2 transition hover:border-oath-gold/40 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <span className="rounded-[var(--radius)] border border-oath-border bg-oath-gold/10 px-4 py-2 text-oath-black">
            Built on Solana
          </span>
        </div>
      </div>
    </footer>
  );
}

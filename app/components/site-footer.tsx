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
    <footer className="relative z-10 border-t border-oath-border/70 bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <div className="space-y-2">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-oath-muted-text">
            OATH
          </p>
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
              className="rounded-md border border-oath-border bg-oath-surface/60 px-4 py-2 transition hover:border-oath-gold/40 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <span className="rounded-md border border-oath-border bg-oath-gold/10 px-4 py-2 text-oath-gold">
            Built on Solana
          </span>
        </div>
      </div>
    </footer>
  );
}

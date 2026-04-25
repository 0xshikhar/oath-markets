import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./components/providers";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "OATH",
    template: "%s · OATH",
  },
  description:
    "Public commitment stakes on Solana with escrow, proof, and reputation.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "OATH",
    description:
      "Make a public oath. Stake real SOL. Follow through in public.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OATH",
    description:
      "Make a public oath. Stake real SOL. Follow through in public.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

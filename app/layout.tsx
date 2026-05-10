import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";
import { InstallPrompt } from "./components/install-prompt";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

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
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OATH",
  },
  applicationName: "OATH",
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

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-background text-foreground antialiased`}>
        <Providers>{children}</Providers>
        <InstallPrompt />
      </body>
    </html>
  );
}
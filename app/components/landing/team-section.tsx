"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TwitterLogo, GithubLogo } from "@phosphor-icons/react/dist/ssr";

export function TeamSection() {
  return (
    <section className="mt-32 space-y-12">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="border-oath-border text-oath-muted-text">THE TEAM</Badge>
        <h2 className="text-4xl font-bold tracking-[-0.04em]">Built by builders, for builders</h2>
      </div>
      <div className="flex justify-center">
        <div className="group relative">
          <div className="absolute -inset-1 bg-oath-gold rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <Card className="relative border-oath-border bg-oath-surface p-8 max-w-sm">
            <div className="space-y-4 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-oath-gold-dim/20 flex items-center justify-center border-2 border-oath-gold/50">
                <span className="text-3xl font-bold">SS</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Shikhar Singh</h3>
                <p className="text-oath-muted-text text-sm">Lead Developer & Founder</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Building the future of on-chain accountability. Focused on making Solana the home for high-integrity communities.
              </p>
              <div className="flex justify-center gap-4 pt-2">
                <Link href="https://twitter.com/0xshikhar" className="text-oath-muted-text hover:text-oath-black transition-colors">
                  <TwitterLogo size={20} weight="fill" />
                </Link>
                <Link href="https://github.com/0xshikhar" className="text-oath-muted-text hover:text-oath-black transition-colors">
                  <GithubLogo size={20} weight="fill" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
"use client";

import { Card } from "@/components/ui/card";

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <Card className="border-oath-border bg-oath-surface/80 p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-oath-gold-dim">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
          <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-2.2 1.8-4 4-4V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-2.2 1.8-4 4-4V8z" />
        </svg>
      </div>
      <p className="text-lg font-medium leading-relaxed italic">"{quote}"</p>
      <div className="flex items-center gap-3 pt-2">
        <div className="h-10 w-10 rounded-full bg-oath-muted/30 border border-oath-border flex items-center justify-center font-bold text-xs">
          {author.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="text-sm font-bold">{author}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </Card>
  );
}

export function TestimonialsSection() {
  return (
    <section className="mt-32 space-y-12 bg-oath-surface/30 -mx-4 px-4 py-20 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-y border-oath-border">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold tracking-[-0.04em]">What makers are saying</h2>
        <p className="text-muted-foreground text-lg">Join hundreds of builders who use OATH to hit their goals.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <TestimonialCard 
          quote="Oath Markets turned my vague 'I should code more' into a 30-day streak with skin in the game. The pressure is real, but so are the results."
          author="Alex Rivera"
          role="Full-stack Developer"
        />
        <TestimonialCard 
          quote="I've backed 5 different makers so far. It's the first time I feel like I'm actually participating in someone's growth, not just watching."
          author="Sarah Chen"
          role="Community Lead"
        />
        <TestimonialCard 
          quote="The on-chain reputation actually matters. People are using my completion score to vet me for freelance gigs. Absolute game changer."
          author="Marcus Thorne"
          role="Indie Maker"
        />
      </div>
    </section>
  );
}
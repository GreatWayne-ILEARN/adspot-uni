import React from "react";
import { Link } from "wouter";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display font-bold text-xl">
            A
          </div>
          <span className="font-display text-2xl font-bold text-foreground tracking-tight">AdSpot</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#explore" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">Explore App</a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          <a href="#stats" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Impact</a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            Z
          </div>
          <span className="text-xl font-bold">Zmantic</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/temples"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse Temples
          </Link>
          <Link href="/temples">
            <Button variant="outline" size="sm">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="sm">Temple Admin</Button>
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t p-4 space-y-3 bg-background">
          <Link
            href="/temples"
            className="block text-sm font-medium"
            onClick={() => setMobileOpen(false)}
          >
            Browse Temples
          </Link>
          <Link
            href="/auth/login"
            className="block text-sm font-medium"
            onClick={() => setMobileOpen(false)}
          >
            Temple Admin
          </Link>
        </div>
      )}
    </header>
  );
}

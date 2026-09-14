"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { navigationItems } from "@/data/navigation";
import Button from "@/components/ui/Button";
import MobileMenu from "./MobileMenu";

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "py-2.5 bg-[var(--color-background)]/85 backdrop-blur-md border-b border-[var(--color-border)] shadow-xs"
            : "py-5 bg-transparent"
        }`}
      >
        <div className="container-site flex items-center justify-between">
          {/* LEFT: NOVA Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-foreground)] flex items-center justify-center text-white font-mono text-sm tracking-tighter group-hover:scale-105 transition-transform">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 19.5H22L12 2Z"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="14" r="2.5" fill="#5E43F3" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base tracking-tight text-[var(--color-foreground)]">
                NOVA
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[var(--color-muted)] -mt-1 uppercase">
                WORKSPACE
              </span>
            </div>
          </Link>

          {/* CENTER: Navigation items (Desktop) */}
          <nav className="hidden md:flex items-center gap-7">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors py-1"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT: Auth & CTA (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/app"
              className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] px-3 py-2 transition-colors"
            >
              Log in
            </Link>
            <Button href="/app" variant="primary" size="sm" withArrow>
              Launch App
            </Button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2.5">
            <Button href="/app" variant="primary" size="sm">
              Launch App
            </Button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-md border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)] transition-colors"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Drawer */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

export default Header;

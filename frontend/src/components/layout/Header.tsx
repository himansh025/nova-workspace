"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { navigationItems } from "@/data/navigation";
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
            ? "py-3 bg-[var(--landing-bg)]/90 backdrop-blur-md border-b border-[var(--landing-border)] shadow-xs"
            : "py-5 bg-transparent border-b border-transparent"
        }`}
      >
        <div className="container-site flex items-center justify-between">
          {/* LEFT: NOVA Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/brand/logo-full-light.png"
              alt="Nova Workspace Logo"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          {/* CENTER: Navigation items (Desktop) - Commented out as currently unused */}
          {/* <nav className="hidden md:flex items-center gap-8">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-[var(--landing-text-muted)] hover:text-[var(--landing-text)] transition-colors py-1"
              >
                {item.label}
              </Link>
            ))}
          </nav> */}

          {/* RIGHT: Auth & CTA (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--landing-text-muted)] hover:text-[var(--landing-text)] px-3 py-2 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-[var(--landing-primary)] hover:bg-[var(--landing-primary-hover)] text-white shadow-xs transition-colors"
            >
              Launch App
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2.5">
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--landing-primary)] hover:bg-[var(--landing-primary-hover)] text-white shadow-xs transition-colors"
            >
              Launch App
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-md border border-[var(--landing-border)] text-[var(--landing-text)] hover:bg-[var(--landing-surface-muted)] transition-colors"
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

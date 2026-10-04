"use client";

import React from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { navigationItems, secondaryNavItems } from "@/data/navigation";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--landing-bg)] flex flex-col justify-between p-6 text-[var(--landing-text)] transition-opacity duration-300">
      {/* Top Bar inside mobile menu */}
      <div className="flex items-center justify-between border-b border-[var(--landing-border)] pb-5">
        <div className="flex items-center gap-2">
          <img
            src="/brand/logo-full-light.png"
            alt="Nova Workspace Logo"
            className="h-8 w-auto object-contain"
          />
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-[var(--landing-surface)] border border-[var(--landing-border)] hover:bg-[var(--landing-surface-muted)] transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-[var(--landing-text-muted)]" />
        </button>
      </div>

      {/* Main Nav Links */}
      <div className="flex flex-col gap-5 my-auto py-8">
        {/* <div className="text-[11px] font-mono uppercase tracking-widest text-[var(--landing-text-muted)]">
          {"// Navigation"}
        </div> */}
        {/* {navigationItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="flex items-center justify-between text-2xl font-normal tracking-tight text-[var(--landing-text)] hover:text-[var(--landing-primary)] hover:translate-x-1 transition-all py-1"
          >
            <span>{item.label}</span>
            <ArrowRight className="w-4 h-4 text-[var(--landing-text-muted)]" />
          </Link>
        ))} */}

        {/* <div className="h-px bg-[var(--landing-border)] my-2" />
        <div className="text-[11px] font-mono uppercase tracking-widest text-[var(--landing-text-muted)]">
          {"// Platform"}
        </div> */}
        {/* <div className="grid grid-cols-2 gap-3">
          {secondaryNavItems.map((sec) => (
            <Link
              key={sec.label}
              href={sec.href}
              onClick={onClose}
              className="text-sm text-[var(--landing-text-muted)] hover:text-[var(--landing-text)] py-1 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--landing-primary)]" />
              <span>{sec.label}</span>
            </Link>
          ))}
        </div> */}
      </div>

      {/* Bottom CTAs */}
      <div className="border-t border-[var(--landing-border)] pt-6 flex flex-col gap-3">
        <Link
          href="/app"
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-[var(--landing-primary)] hover:bg-[var(--landing-primary-hover)] text-white text-center font-medium shadow-xs block transition-colors text-sm"
        >
          Launch Workspace App
        </Link>
        <Link
          href="/login"
          onClick={onClose}
          className="w-full py-3 text-sm text-[var(--landing-text-muted)] hover:text-[var(--landing-text)] text-center font-medium block"
        >
          Sign in to Workspace
        </Link>
      </div>
    </div>
  );
};

export default MobileMenu;

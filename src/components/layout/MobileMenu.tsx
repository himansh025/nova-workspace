"use client";

import React from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { navigationItems, secondaryNavItems } from "@/data/navigation";
import Button from "@/components/ui/Button";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0C0E]/95 backdrop-blur-xl flex flex-col justify-between p-6 text-white transition-opacity duration-300">
      {/* Top Bar inside mobile menu */}
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--color-accent)] to-[#8C75FF] flex items-center justify-center text-white font-bold text-sm shadow-md">
            ✦
          </div>
          <span className="font-semibold tracking-wider text-base">NOVA</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>
      </div>

      {/* Main Nav Links */}
      <div className="flex flex-col gap-5 my-auto py-8">
        <div className="text-[11px] font-mono uppercase tracking-widest text-white/40">
          {"// Navigation"}
        </div>
        {navigationItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="flex items-center justify-between text-2xl font-normal tracking-tight text-white/90 hover:text-white hover:translate-x-1 transition-all py-1"
          >
            <span>{item.label}</span>
            <ArrowRight className="w-4 h-4 text-white/30" />
          </Link>
        ))}

        <div className="h-px bg-white/10 my-2" />

        <div className="text-[11px] font-mono uppercase tracking-widest text-white/40">
          {"// Platform"}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {secondaryNavItems.map((sec) => (
            <Link
              key={sec.label}
              href={sec.href}
              onClick={onClose}
              className="text-sm text-white/70 hover:text-white py-1 flex items-center gap-1.5"
            >
              <span className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />
              <span>{sec.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom CTAs */}
      <div className="border-t border-white/10 pt-6 flex flex-col gap-3">
        <Button
          href="/app"
          variant="secondary"
          size="lg"
          withArrow
          onClick={onClose}
          className="w-full justify-center"
        >
          Launch Workspace App
        </Button>
        <Link
          href="/login"
          onClick={onClose}
          className="w-full py-3 text-sm text-white/70 hover:text-white text-center font-medium block"
        >
          Sign in to Workspace
        </Link>
      </div>
    </div>
  );
};

export default MobileMenu;

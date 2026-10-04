import React from "react";
import Link from "next/link";
import { footerNavigation } from "@/data/navigation";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[var(--landing-surface-muted)] text-[var(--landing-text-muted)] border-t border-[var(--landing-border)] pt-20 pb-14">
      <div className="container-site">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 pb-16 border-b border-[var(--landing-border)]">
          {/* Brand Column */}
          <div className="col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/brand/logo-full-light.png"
                  alt="Nova Workspace Logo"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <p className="text-sm text-[var(--landing-text-muted)] max-w-sm font-normal leading-relaxed">
                The unified AI workspace for modern product and engineering teams.
                Turn ideas into momentum.
              </p>
            </div>
          </div>

          {/* PRODUCT */}
          <div>
            <h4 className="text-xs font-mono tracking-widest uppercase text-[var(--landing-text-muted)] opacity-80 mb-4">
              PRODUCT
            </h4>
            <ul className="space-y-2.5">
              {footerNavigation.product.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--landing-text-muted)] hover:text-[var(--landing-text)] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* RESOURCES - Commented out as currently unused */}
          {/* <div>
            <h4 className="text-xs font-mono tracking-widest uppercase text-[var(--landing-text-muted)] opacity-80 mb-4">
              RESOURCES
            </h4>
            <ul className="space-y-2.5">
              {footerNavigation.resources.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--landing-text-muted)] hover:text-[var(--landing-text)] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div> */}

          {/* COMPANY - Commented out as currently unused */}
          {/* <div>
            <h4 className="text-xs font-mono tracking-widest uppercase text-[var(--landing-text-muted)] opacity-80 mb-4">
              COMPANY
            </h4>
            <ul className="space-y-2.5">
              {footerNavigation.company.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--landing-text-muted)] hover:text-[var(--landing-text)] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div> */}

          {/* LEGAL - Commented out as currently unused */}
          {/* <div>
            <h4 className="text-xs font-mono tracking-widest uppercase text-[var(--landing-text-muted)] opacity-80 mb-4">
              LEGAL
            </h4>
            <ul className="space-y-2.5">
              {footerNavigation.legal.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--landing-text-muted)] hover:text-[var(--landing-text)] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div> */}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--landing-text-muted)]">
          <div>
            © 2026 NOVA Workspace Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

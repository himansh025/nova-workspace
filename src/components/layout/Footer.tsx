import React from "react";
import Link from "next/link";
import { footerNavigation } from "@/data/navigation";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0A0B0D] text-white border-t border-white/10 pt-20 pb-14">
      <div className="container-site">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 pb-16 border-b border-white/10">
          {/* Brand Column */}
          <div className="col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
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
                  <span className="font-semibold text-base tracking-tight text-white">
                    NOVA
                  </span>
                  <span className="text-[9px] font-mono tracking-widest text-white/50 uppercase">
                    WORKSPACE
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-400 max-w-sm font-normal leading-relaxed">
                The unified AI workspace for modern product and engineering teams.
                Turn ideas into momentum.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-neutral-400">
                All systems operational • v2.4.0
              </span>
            </div>
          </div>

          {/* PRODUCT */}
          <div>
            <h4 className="text-xs font-mono tracking-widest uppercase text-white/40 mb-4">
              PRODUCT
            </h4>
            <ul className="space-y-2.5">
              {footerNavigation.product.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* RESOURCES */}
          <div>
            <h4 className="text-xs font-mono tracking-widest uppercase text-white/40 mb-4">
              RESOURCES
            </h4>
            <ul className="space-y-2.5">
              {footerNavigation.resources.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h4 className="text-xs font-mono tracking-widest uppercase text-white/40 mb-4">
              COMPANY
            </h4>
            <ul className="space-y-2.5">
              {footerNavigation.company.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h4 className="text-xs font-mono tracking-widest uppercase text-white/40 mb-4">
              LEGAL
            </h4>
            <ul className="space-y-2.5">
              {footerNavigation.legal.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
          <div>
            © 2026 NOVA Workspace Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Security: SOC2 Type II Certified</span>
            <span>Zero Data Retention AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

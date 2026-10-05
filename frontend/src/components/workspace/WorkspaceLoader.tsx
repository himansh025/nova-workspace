"use client";

import React from "react";

export const WorkspaceLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--nova-bg)] select-none overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-[var(--nova-accent)]/12 via-[var(--nova-ai)]/8 to-transparent blur-3xl pointer-events-none -translate-y-6" />

      {/* Main Container */}
      <div className="relative flex flex-col items-center gap-6 z-10">
        {/* Logo with Orbital Ring */}
        <div className="relative flex items-center justify-center w-20 h-20">
          {/* Subtle outer static ring */}
          <div className="absolute inset-0 rounded-2xl border border-[var(--nova-border)] bg-[var(--nova-surface)] shadow-lg" />

          {/* Animated gradient spinning glow border */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--nova-accent)]/40 via-transparent to-[var(--nova-ai)]/40 animate-spin [animation-duration:3s] blur-[2px]" />

          {/* Inner card with logo */}
          <div className="relative w-full h-full rounded-2xl bg-[var(--nova-surface)] flex items-center justify-center p-3.5 z-10 border border-[var(--nova-border-strong)]">
            <img
              src="/brand/logo-mark.png"
              alt="Nova"
              className="w-10 h-10 object-contain drop-shadow-sm transition-transform duration-700 animate-pulse"
            />
          </div>
        </div>

        {/* Brand & Loading Info */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--nova-text-secondary)] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nova-accent)] animate-ping" />
            <span>Nova Workspace</span>
          </div>

          {/* Sleek thin progress shimmer bar */}
          <div className="w-36 h-[2px] bg-[var(--nova-border)] rounded-full overflow-hidden relative mt-1">
            <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-[var(--nova-accent)] to-transparent rounded-full animate-[shimmer_1.4s_infinite_ease-in-out]" />
          </div>

          <p className="text-[11.5px] text-[var(--nova-text-muted)] font-mono tracking-tight mt-1">
            Initializing secure workspace
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceLoader;

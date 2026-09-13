import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
  tag?: string;
  isDark?: boolean;
  className?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  children,
  tag,
  isDark = false,
  className = ""
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase transition-colors duration-150 ${
        isDark
          ? "bg-white/10 text-white/80 border border-white/10"
          : "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)]"
      } ${className}`}
    >
      {tag && <span className="opacity-60">{tag}</span>}
      <span className="font-semibold">{children}</span>
    </div>
  );
};

export default SectionLabel;

"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "dark" | "ghost";
  size?: "sm" | "md" | "lg";
  withArrow?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  href,
  variant = "primary",
  size = "md",
  withArrow = false,
  className = "",
  onClick,
  type = "button",
  disabled = false
}) => {
  const baseClasses =
    "group inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)]";

  const sizeClasses = {
    sm: "text-xs px-3.5 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-4.5 py-2.5 rounded-xl gap-2",
    lg: "text-base px-6 py-3.5 rounded-xl gap-2.5 font-medium"
  }[size];

  const variantClasses = {
    primary:
      "bg-[var(--landing-primary)] text-white hover:bg-[var(--landing-primary-hover)] shadow-xs active:scale-[0.99]",
    secondary:
      "bg-[var(--landing-primary)] text-white hover:bg-[var(--landing-primary-hover)] shadow-xs active:scale-[0.99]",
    outline:
      "bg-[var(--landing-surface)] text-[var(--landing-text)] border border-[var(--landing-border)] hover:bg-[var(--landing-surface-muted)]",
    dark:
      "bg-white text-black hover:bg-neutral-200 border border-white/10 active:scale-[0.99]",
    ghost:
      "bg-transparent text-[var(--landing-text-muted)] hover:text-[var(--landing-text)] hover:bg-black/5"
  }[variant];

  const combinedClasses = `${baseClasses} ${sizeClasses} ${variantClasses} ${className} ${
    disabled ? "opacity-50 pointer-events-none" : ""
  }`;

  const content = (
    <>
      <span>{children}</span>
      {withArrow && (
        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
    >
      {content}
    </button>
  );
};

export default Button;

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ArrowLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  isExternal?: boolean;
}

export const ArrowLink: React.FC<ArrowLinkProps> = ({
  href,
  children,
  className = "",
  isExternal = false
}) => {
  const content = (
    <span
      className={`group inline-flex items-center gap-1.5 text-sm font-medium text-[var(--landing-primary)] hover:text-[var(--landing-primary-hover)] transition-colors duration-150 ${className}`}
    >
      <span>{children}</span>
      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
    </span>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <Link href={href}>{content}</Link>;
};

export default ArrowLink;

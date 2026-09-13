"use client";

import React, { useEffect, useRef } from "react";
import { animateReveal } from "@/lib/animations/reveal";
import { gsap } from "@/lib/animations/gsap";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  className = "",
  delay = 0,
  y = 20,
  duration = 0.7
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      if (ref.current) {
        animateReveal(ref.current, {
          trigger: ref.current,
          y,
          delay,
          duration
        });
      }
    }, ref);

    return () => ctx.revert();
  }, [delay, y, duration]);

  return (
    <div ref={ref} className={className} data-reveal>
      {children}
    </div>
  );
};

export default Reveal;

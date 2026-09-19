import { gsap, initGsap } from "./gsap";

export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const animateReveal = (
  targets: string | Element | Element[],
  options: {
    trigger?: string | Element;
    y?: number;
    delay?: number;
    stagger?: number;
    duration?: number;
    start?: string;
  } = {}
) => {
  initGsap();

  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0, clearProps: "all" });
    return;
  }

  const {
    trigger = targets,
    y = 24,
    delay = 0,
    stagger = 0.08,
    duration = 0.8,
    start = "top 88%"
  } = options;

  return gsap.fromTo(
    targets,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      delay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: trigger as gsap.DOMTarget,
        start,
        toggleActions: "play none none reverse"
      }
    }
  );
};

export const animateHeroLoad = (
  headline: Element | null,
  subheading: Element | null,
  ctas: Element | null,
  preview: Element | null
) => {
  initGsap();

  if (prefersReducedMotion()) {
    if (headline) gsap.set(headline, { opacity: 1, y: 0 });
    if (subheading) gsap.set(subheading, { opacity: 1, y: 0 });
    if (ctas) gsap.set(ctas, { opacity: 1, y: 0 });
    if (preview) gsap.set(preview, { opacity: 1, y: 0, scale: 1 });
    return;
  }

  const tl = gsap.timeline({
    defaults: { ease: "power2.out" }
  });

  if (headline) {
    tl.fromTo(
      headline,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.85, clearProps: "transform" }
    );
  }

  if (subheading) {
    tl.fromTo(
      subheading,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.7 },
      "-=0.55"
    );
  }

  if (ctas) {
    tl.fromTo(
      ctas,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.6 },
      "-=0.45"
    );
  }

  if (preview) {
    tl.fromTo(
      preview,
      { opacity: 0, y: 28, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.95 },
      "-=0.4"
    );
  }

  return tl;
};

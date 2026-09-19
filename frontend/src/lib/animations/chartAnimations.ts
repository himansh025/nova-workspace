import { gsap, initGsap } from "./gsap";
import { prefersReducedMotion } from "./reveal";

export const animateChartLine = (
  path: SVGPathElement,
  triggerElement: HTMLElement,
  options: { duration?: number; delay?: number } = {}
) => {
  initGsap();

  if (!path || prefersReducedMotion()) return;

  const length = path.getTotalLength ? path.getTotalLength() : 600;

  gsap.set(path, {
    strokeDasharray: length,
    strokeDashoffset: length
  });

  return gsap.to(path, {
    strokeDashoffset: 0,
    duration: options.duration || 1.6,
    delay: options.delay || 0.1,
    ease: "power2.out",
    scrollTrigger: {
      trigger: triggerElement,
      start: "top 80%",
      toggleActions: "play none none reverse"
    }
  });
};

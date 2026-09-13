import { gsap, ScrollTrigger, initGsap } from "./gsap";
import { prefersReducedMotion } from "./reveal";

export const initHorizontalWorkflow = (
  container: HTMLElement,
  track: HTMLElement
) => {
  initGsap();

  if (prefersReducedMotion() || !container || !track) {
    return;
  }

  // Calculate scroll amount
  const getScrollAmount = () => -(track.scrollWidth - window.innerWidth + 80);

  const tween = gsap.to(track, {
    x: getScrollAmount,
    ease: "none"
  });

  const trigger = ScrollTrigger.create({
    trigger: container,
    start: "top top",
    end: () => `+=${track.scrollWidth - window.innerWidth + 300}`,
    pin: true,
    animation: tween,
    scrub: 1,
    invalidateOnRefresh: true
  });

  return { trigger, tween };
};

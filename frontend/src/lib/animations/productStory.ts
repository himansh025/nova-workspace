import { gsap, ScrollTrigger, initGsap } from "./gsap";
import { prefersReducedMotion } from "./reveal";

export interface ProductStoryElements {
  container: HTMLElement;
  stickyWrapper: HTMLElement;
  planPanel: HTMLElement | null;
  taskPanel: HTMLElement | null;
  aiPanel: HTMLElement | null;
  insightsPanel: HTMLElement | null;
  releasePanel: HTMLElement | null;
  navTabs?: HTMLElement[];
  progressBar?: HTMLElement | null;
}

export const initProductStoryTimeline = (elements: ProductStoryElements) => {
  initGsap();

  if (prefersReducedMotion() || !elements.container || !elements.stickyWrapper) {
    return null;
  }

  const {
    stickyWrapper,
    planPanel,
    taskPanel,
    aiPanel,
    insightsPanel,
    releasePanel,
    navTabs = [],
    progressBar
  } = elements;

  const setActiveTab = (index: number) => {
    navTabs.forEach((tab, i) => {
      if (i === index) {
        tab.classList.add("active-tab", "bg-[var(--landing-primary)]", "text-white", "font-semibold");
        tab.classList.remove("text-neutral-500", "hover:text-neutral-900");
        tab.setAttribute("aria-selected", "true");
        tab.style.backgroundColor = "";
        tab.style.color = "";
        tab.style.fontWeight = "";
      } else {
        tab.classList.remove("active-tab", "bg-[var(--landing-primary)]", "text-white", "font-semibold");
        tab.classList.add("text-neutral-500", "hover:text-neutral-900");
        tab.setAttribute("aria-selected", "false");
        tab.style.backgroundColor = "";
        tab.style.color = "";
        tab.style.fontWeight = "";
      }
    });
  };

  // Timeline with scrub
  const tl = gsap.timeline({
    defaults: { ease: "power1.inOut" },
    onUpdate: function () {
      const progress = this.progress();
      if (progressBar) {
        progressBar.style.transform = `scaleX(${progress})`;
      }
      if (progress < 0.2) {
        setActiveTab(0);
      } else if (progress < 0.42) {
        setActiveTab(1);
      } else if (progress < 0.65) {
        setActiveTab(2);
      } else if (progress < 0.85) {
        setActiveTab(3);
      } else {
        setActiveTab(4);
      }
    }
  });

  // Initial states using autoAlpha (autoAlpha toggles visibility: hidden when opacity: 0)
  if (planPanel) {
    gsap.set(planPanel, { autoAlpha: 1, x: 0 });
  }
  if (taskPanel) {
    gsap.set(taskPanel, { autoAlpha: 0, x: 40, scale: 0.98 });
  }
  if (aiPanel) {
    gsap.set(aiPanel, { autoAlpha: 0, x: 40, scale: 0.98 });
  }
  if (insightsPanel) {
    gsap.set(insightsPanel, { autoAlpha: 0, y: 20, scale: 0.98 });
  }
  if (releasePanel) {
    gsap.set(releasePanel, { autoAlpha: 0, scale: 0.98 });
  }

  // --- Step 1 (Plan) -> Step 2 (Build/TaskBoard) ---
  tl.to(
    planPanel,
    {
      autoAlpha: 0,
      x: -30,
      duration: 0.1,
      pointerEvents: "none"
    },
    0.16
  );

  tl.to(
    taskPanel,
    {
      autoAlpha: 1,
      x: 0,
      scale: 1,
      duration: 0.14,
      pointerEvents: "auto"
    },
    0.20
  );

  // --- Step 2 (Build) -> Step 3 (AI Panel) ---
  tl.to(
    taskPanel,
    {
      autoAlpha: 0,
      x: -30,
      duration: 0.1,
      pointerEvents: "none"
    },
    0.38
  );

  tl.to(
    aiPanel,
    {
      autoAlpha: 1,
      x: 0,
      scale: 1,
      duration: 0.14,
      pointerEvents: "auto"
    },
    0.42
  );

  // --- Step 3 (AI Panel) -> Step 4 (Insights) ---
  tl.to(
    aiPanel,
    {
      autoAlpha: 0,
      x: -30,
      duration: 0.1,
      pointerEvents: "none"
    },
    0.60
  );

  tl.to(
    insightsPanel,
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.14,
      pointerEvents: "auto"
    },
    0.65
  );

  // --- Step 4 (Insights) -> Step 5 (Release / Ship) ---
  tl.to(
    insightsPanel,
    {
      autoAlpha: 0,
      scale: 0.97,
      duration: 0.1,
      pointerEvents: "none"
    },
    0.80
  );

  tl.to(
    releasePanel,
    {
      autoAlpha: 1,
      scale: 1,
      duration: 0.14,
      pointerEvents: "auto"
    },
    0.85
  );

  // Rest / hold at final stage 5 until unpin
  tl.to({}, { duration: 0.15 }, 0.99);

  // ScrollTrigger pinned configuration with exact pinSpacing
  const scrollTrigger = ScrollTrigger.create({
    trigger: stickyWrapper,
    start: "top top",
    end: "+=2800",
    pin: true,
    pinSpacing: true,
    animation: tl,
    scrub: 0.8,
    anticipatePin: 1,
    invalidateOnRefresh: true
  });

  return { scrollTrigger, timeline: tl };
};

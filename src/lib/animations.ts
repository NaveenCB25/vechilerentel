export const easeOutExpo = [0.22, 1, 0.36, 1] as const;

export const viewportOnce = {
  once: true,
  amount: 0.2,
};

export const pageReveal = {
  initial: { opacity: 0, y: 24, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -18, scale: 0.995 },
  transition: { duration: 0.45, ease: easeOutExpo },
};

export const pageSlide = {
  initial: { opacity: 0, x: 28, scale: 0.99 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -20, scale: 0.995 },
  transition: { duration: 0.45, ease: easeOutExpo },
};

export const sectionStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

export const heroStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.18,
    },
  },
};

export const revealUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: easeOutExpo },
  },
};

export const revealSoft = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: easeOutExpo },
  },
};

export const revealSide = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: easeOutExpo },
  },
};

export const hoverLift = {
  y: -10,
  transition: { duration: 0.24, ease: easeOutExpo },
};

export const hoverNudge = {
  x: 6,
  transition: { duration: 0.24, ease: easeOutExpo },
};

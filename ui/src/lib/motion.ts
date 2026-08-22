/**
 * 摸鱼舱 MOYU — Framer Motion 共享 variants
 */

import type { Variants } from "framer-motion";

/** 平滑出场缓动 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Hero 标题 stagger 容器 */
export const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

/** Hero 子项淡入上移 */
export const heroItem: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: EASE_OUT },
  },
};

/** Section 通用 reveal */
export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 48 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

/** 卡片列表 stagger */
export const listStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/** 卡片单项 reveal */
export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

/** 标题淡入 */
export const headingReveal: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

/** 视口触发配置 */
export const viewportOnce = { once: true, amount: 0.2 } as const;

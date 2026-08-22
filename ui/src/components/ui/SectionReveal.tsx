/**
 * SectionReveal — Section 进场动画包装
 * 提供 Mask Reveal（clip-path）+ 视差 + stagger
 */
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { EASE_OUT, viewportOnce } from "@/lib/motion";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  /** 视差强度（0-1），0 = 无视差 */
  parallax?: number;
}

export default function SectionReveal({
  children,
  className = "",
  parallax = 0.1,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40 * parallax, -40 * parallax]);

  return (
    <motion.div
      ref={ref}
      style={parallax > 0 ? { y } : undefined}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={{
        hidden: {
          opacity: 0,
          y: 50,
          filter: "blur(12px)",
          clipPath: "inset(0 0 100% 0)",
        },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          clipPath: "inset(0 0 0% 0)",
          transition: {
            duration: 1,
            ease: EASE_OUT,
            opacity: { duration: 0.8 },
            filter: { duration: 0.9 },
            clipPath: { duration: 1, ease: EASE_OUT },
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

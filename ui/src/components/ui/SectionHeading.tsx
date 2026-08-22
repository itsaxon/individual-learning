/**
 * SectionHeading — 通用区块标题（亮色蓝调版）
 * - 仅主标题（可选 eyebrow / 副标题）
 * - 配合 Framer Motion 进场
 */
import { motion } from "framer-motion";
import { headingReveal, viewportOnce } from "@/lib/motion";

interface SectionHeadingProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  align?: "left" | "center";
}

export default function SectionHeading({
  title,
  eyebrow,
  subtitle,
  align = "left",
}: SectionHeadingProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.1 } },
      }}
      className={`flex flex-col gap-4 ${
        align === "center" ? "items-center text-center" : "items-start"
      }`}
    >
      {eyebrow && (
        <motion.div
          variants={headingReveal}
          className="flex items-center gap-3 font-heading text-xs tracking-[0.2em] text-slate-500"
        >
          <span className="h-px w-8 bg-gradient-to-r from-blue-600 to-transparent md:w-10" />
          <span>{eyebrow}</span>
        </motion.div>
      )}
      <motion.h2
        variants={headingReveal}
        className="font-display text-display-2 font-bold tracking-tight md:text-display-1"
      >
        <span className="gradient-text">{title}</span>
      </motion.h2>
      {subtitle && (
        <motion.p
          variants={headingReveal}
          className="max-w-xl text-base text-slate-600 text-balance"
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}

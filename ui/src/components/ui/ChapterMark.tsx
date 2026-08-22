/**
 * ChapterMark — Scrollytelling 章节标记
 *
 * 显示在 Section 之间，电影章节切换感
 * 大编号 + 章节标题 + 装饰线 + Mask Reveal 进场
 */
import { motion } from "framer-motion";
import { EASE_OUT, viewportOnce } from "@/lib/motion";

interface ChapterMarkProps {
  index: string;
  title: string;
  subtitle?: string;
}

export default function ChapterMark({ index, title, subtitle }: ChapterMarkProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
      className="relative my-16 flex items-center justify-center gap-6 md:my-24"
    >
      {/* 左装饰线 */}
      <motion.div
        variants={{
          hidden: { scaleX: 0, opacity: 0 },
          show: {
            scaleX: 1,
            opacity: 1,
            transition: { duration: 0.8, ease: EASE_OUT },
          },
        }}
        className="hidden h-px w-32 origin-right bg-gradient-to-l from-violet/60 to-transparent md:block"
      />

      <div className="flex flex-col items-center gap-2">
        <motion.span
          variants={{
            hidden: { opacity: 0, y: -10, filter: "blur(8px)" },
            show: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.7, ease: EASE_OUT },
            },
          }}
          className="font-display text-[10px] font-bold tracking-[0.4em] text-text-3"
        >
          章节
        </motion.span>
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.6 },
            show: {
              opacity: 1,
              scale: 1,
              transition: { duration: 0.8, ease: EASE_OUT },
            },
          }}
          className="flex items-baseline gap-3"
        >
          <span className="font-display text-5xl font-black tabular-nums gradient-text md:text-6xl">
            {index}
          </span>
          <span className="font-heading text-base font-medium tracking-[0.2em] text-white md:text-xl">
            {title}
          </span>
        </motion.div>
        {subtitle && (
          <motion.span
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { duration: 0.8, delay: 0.2 } },
            }}
            className="mt-1 max-w-md text-center text-xs text-text-3 md:text-sm"
          >
            {subtitle}
          </motion.span>
        )}
      </div>

      {/* 右装饰线 */}
      <motion.div
        variants={{
          hidden: { scaleX: 0, opacity: 0 },
          show: {
            scaleX: 1,
            opacity: 1,
            transition: { duration: 0.8, ease: EASE_OUT },
          },
        }}
        className="hidden h-px w-32 origin-left bg-gradient-to-r from-cyan/60 to-transparent md:block"
      />
    </motion.div>
  );
}

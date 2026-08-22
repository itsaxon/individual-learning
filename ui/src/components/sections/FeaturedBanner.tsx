/**
 * FeaturedBanner — 今日推荐（亮色蓝调版）
 * 全宽 Banner 自动轮播（6.5s）+ 左右切换 + 渐变遮罩
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { accentColorMap, bannerSlides } from "@/lib/data";
import { viewportOnce } from "@/lib/motion";

const AUTO_MS = 6500;

export default function FeaturedBanner() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number>();

  const next = useCallback(() => {
    setIdx((i) => (i + 1) % bannerSlides.length);
  }, []);
  const prev = useCallback(() => {
    setIdx((i) => (i - 1 + bannerSlides.length) % bannerSlides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = window.setTimeout(next, AUTO_MS);
    return () => window.clearTimeout(timerRef.current);
  }, [idx, paused, next]);

  const slide = bannerSlides[idx];
  const c = accentColorMap[slide.accent];

  return (
    <section
      id="featured"
      className="relative z-10 py-24 md:py-32"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container">
        <SectionHeading title="今日推荐" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mt-10 h-[420px] w-[calc(100%-1.5rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white sm:mt-12 sm:w-[calc(100%-3rem)] md:h-[560px] lg:h-[620px]"
        style={{ boxShadow: `0 30px 60px -30px rgba(${c.rgb},0.4)` }}
      >
        {/* 背景图层 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* 多层遮罩（保持图像底部信息可读） */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.55) 30%, rgba(15,23,42,0.15) 60%, transparent 100%),
                        linear-gradient(0deg, rgba(15,23,42,0.85) 0%, transparent 50%),
                        radial-gradient(circle at 80% 50%, rgba(${c.rgb},0.25), transparent 50%)`,
          }}
        />

        {/* 内容 */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: -30, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -10, filter: "blur(8px)" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex max-w-xl flex-col gap-5"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.15em]"
                  style={{
                    background: `rgba(${c.rgb},0.25)`,
                    color: "#ffffff",
                    border: `1px solid rgba(${c.rgb},0.5)`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full"
                    style={{ background: "#ffffff" }}
                  />
                  今日精选
                </span>
                <span className="font-heading text-xs tracking-[0.2em] text-white/70">
                  0{idx + 1} / 0{bannerSlides.length}
                </span>
              </div>

              <h2 className="font-display text-display-2 font-black leading-[0.95] tracking-tight text-white md:text-hero-sm">
                {slide.title}
              </h2>
              <p className="max-w-md text-sm text-white/80 text-balance md:text-lg">
                {slide.subtitle}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <a
                  href="#/games/cihai-xunzong"
                  className="ripple-host group relative flex items-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-105 sm:px-7 sm:py-3.5 sm:text-base"
                >
                  <span
                    className="absolute inset-0 -z-10"
                    style={{
                      background: `linear-gradient(135deg, ${c.hex} 0%, #0ea5e9 100%)`,
                      boxShadow: `0 8px 24px -6px rgba(${c.rgb},0.6)`,
                    }}
                  />
                  <Play className="h-5 w-5 fill-white" />
                  <span>{slide.cta}</span>
                </a>
                <button className="rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/25 sm:px-6 sm:py-3.5">
                  加入愿望单
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 左右切换 */}
        <button
          onClick={prev}
          aria-label="上一个"
          className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-all hover:border-white/60 hover:bg-white/40 md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          aria-label="下一个"
          className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-all hover:border-white/60 hover:bg-white/40 md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* 指示器 */}
        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 sm:bottom-8 sm:right-8">
          {bannerSlides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIdx(i)}
              aria-label={`切换到第 ${i + 1} 张`}
              className="group relative h-1.5 overflow-hidden rounded-full bg-white/40 transition-all duration-500"
              style={{ width: i === idx ? 48 : 16 }}
            >
              {i === idx && !paused && (
                <motion.span
                  key={`${idx}-${paused}`}
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, ${accentColorMap[s.accent].hex}, #0ea5e9)`,
                  }}
                />
              )}
              {i === idx && paused && (
                <span
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, ${accentColorMap[s.accent].hex}, #0ea5e9)`,
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

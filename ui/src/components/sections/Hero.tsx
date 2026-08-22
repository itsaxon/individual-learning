/**
 * Hero — 首屏主视觉（亮色蓝调版）
 * 左：蓝色渐变标题 + 副标 + 双 CTA + 数据条
 * 右：漂浮卡片堆叠（鼠标视差 + 缓慢漂浮）
 */
import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Play, Sparkles, ChevronRight, Star, Users, BookOpen } from "lucide-react";
import MagneticButton from "@/components/ui/MagneticButton";
import { popularGames, accentColorMap } from "@/lib/data";
import { heroContainer, heroItem } from "@/lib/motion";

const STATS = [
  { label: "在线摸鱼中", value: "1.2M+" },
  { label: "游戏库", value: "12,400" },
  { label: "好评率", value: "97%" },
];

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // 鼠标视差
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), {
    stiffness: 150,
    damping: 20,
  });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), {
    stiffness: 150,
    damping: 20,
  });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      mx.set(x);
      my.set(y);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  // 三张漂浮卡片：找出冒牌货（主）/ 九宫寻数 / 人生重开
  const featured = [
    popularGames[2], // 找出冒牌货 — 主卡片
    popularGames[1], // 九宫寻数 — 后景右上
    popularGames[3], // 人生重开 — 后景左下
  ];

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-[100svh] overflow-hidden pt-28 md:pt-32"
    >
      {/* 顶部柔光（蓝色） */}
      <motion.div
        style={{ y: scrollY, opacity }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-0 h-[60vh] w-[80%] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
      </motion.div>

      <div className="container relative z-10 grid min-h-[80svh] grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
        {/* ============ LEFT ============ */}
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6 md:gap-7"
        >
          {/* Eyebrow */}
          <motion.div
            variants={heroItem}
            className="inline-flex w-fit items-center gap-2.5 rounded-full border border-slate-200 bg-white/80 px-4 py-2 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            <span className="font-heading text-xs tracking-[0.2em] text-slate-700">
              打工人专属 · 上班摸鱼神器
            </span>
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          </motion.div>

          {/* Title */}
          <motion.h1 variants={heroItem} className="flex flex-col">
            <span className="relative block font-heading text-hero-sm font-black leading-[0.95] tracking-normal text-slate-900 md:text-hero">
              摸鱼
            </span>
            <span className="relative block font-heading text-hero-sm font-black leading-[0.95] tracking-normal md:text-hero">
              <span
                aria-hidden
                className="absolute inset-0 text-blue-300"
                style={{
                  transform: "translate(4px, 4px)",
                  filter: "blur(1.5px)",
                  opacity: 0.5,
                }}
              >
                时刻
              </span>
              <span className="relative gradient-text">时刻</span>
            </span>
          </motion.h1>

          {/* CTAs */}
          <motion.div
            variants={heroItem}
            className="flex flex-wrap items-center gap-3"
          >
            <MagneticButton
              variant="primary"
              className="!px-7 !py-3.5 !text-base"
              onClick={() => {
                document
                  .getElementById("popular")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Play className="h-5 w-5 fill-white" />
              <span>立即摸鱼</span>
            </MagneticButton>
            <MagneticButton
              variant="glass"
              className="!px-7 !py-3.5 !text-base"
              onClick={() => {
                window.location.hash = "#/novels";
              }}
            >
              <BookOpen className="h-5 w-5" />
              <span>看会小说</span>
              <ChevronRight className="h-5 w-5" />
            </MagneticButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={heroItem}
            className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-slate-200 pt-6 md:gap-x-10"
          >
            {STATS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="font-display text-2xl font-bold tabular-nums text-slate-900 md:text-3xl">
                  {s.value}
                </span>
                <span className="font-heading text-[10px] tracking-[0.15em] text-slate-500">
                  {s.label}
                </span>
                {i < STATS.length - 1 && (
                  <span className="ml-4 hidden h-8 w-px bg-slate-200 md:ml-7 md:block" />
                )}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ============ RIGHT — Floating Cards ============ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: scrollY, opacity, perspective: 1200 }}
          className="relative hidden h-[480px] items-center justify-center sm:flex sm:h-[520px] lg:h-[600px]"
        >
          <motion.div
            style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
            className="relative h-full w-full"
          >
            {/* 后景卡片 */}
            <FloatingCard
              game={featured[1]}
              className="absolute right-[8%] top-[10%] h-[240px] w-[180px] rotate-[8deg] sm:h-[280px] sm:w-[210px]"
              delay={0.6}
            />
            <FloatingCard
              game={featured[2]}
              className="absolute left-[6%] bottom-[6%] h-[220px] w-[170px] -rotate-[10deg] sm:h-[260px] sm:w-[200px]"
              delay={0.9}
            />

            {/* 主卡片 */}
            <motion.div
              initial={{ opacity: 0, y: 60, rotate: -4 }}
              animate={{ opacity: 1, y: 0, rotate: -3 }}
              transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-1/2 z-20 h-[360px] w-[260px] -translate-x-1/2 -translate-y-1/2 animate-float-slow sm:h-[420px] sm:w-[300px]"
              style={{ transform: "translateZ(60px)" }}
            >
              <FloatingCardContent game={featured[0]} />
            </motion.div>

            {/* 漂浮 Badge: Live Players */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="absolute -right-1 top-[16%] z-30 sm:-right-2 sm:top-[18%]"
              style={{ transform: "translateZ(120px)" }}
            >
              <div
                className="flex items-center gap-2.5 rounded-2xl border border-blue-200 bg-white/90 px-3.5 py-3 shadow-lg shadow-blue-500/15 backdrop-blur-xl sm:px-4"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-display text-sm font-bold tabular-nums text-slate-900">
                    312,045
                  </span>
                  <span className="font-heading text-[9px] tracking-[0.15em] text-blue-600">
                    正在摸鱼
                  </span>
                </div>
                <span className="ml-1 h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              </div>
            </motion.div>

            {/* 装饰：环形虚线 */}
            <motion.div
              className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-blue-300/40 sm:h-[480px] sm:w-[480px]"
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              style={{ transform: "translateZ(20px)" }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-sky-300/30 sm:h-[620px] sm:w-[620px]"
              animate={{ rotate: -360 }}
              transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
              style={{ transform: "translateZ(10px)" }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* 底部 scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="font-heading text-[10px] tracking-[0.3em] text-slate-500">
          向下滚动
        </span>
        <div className="relative h-12 w-px overflow-hidden bg-slate-200">
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-blue-600 to-transparent"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}

/* ============ Floating Card Sub-components ============ */

interface FloatingCardProps {
  game: (typeof popularGames)[number];
  className: string;
  delay: number;
}

function FloatingCard({ game, className, delay }: FloatingCardProps) {
  const c = accentColorMap[game.accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative ${className}`}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-2xl border bg-white"
        style={{
          borderColor: `rgba(${c.rgb},0.3)`,
          boxShadow: `0 20px 40px -15px rgba(${c.rgb},0.35)`,
        }}
      >
        <img
          src={game.cover}
          alt={game.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 50%, rgba(${c.rgb},0.25) 80%, rgba(15,23,42,0.85) 100%)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <span className="font-display text-[10px] font-bold tracking-wider text-white">
            {game.title}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function FloatingCardContent({
  game,
}: {
  game: (typeof popularGames)[number];
}) {
  const c = accentColorMap[game.accent];
  return (
    <div
      className="group relative h-full w-full overflow-hidden rounded-3xl border bg-white"
      style={{
        borderColor: `rgba(${c.rgb},0.35)`,
        boxShadow: `0 30px 60px -20px rgba(${c.rgb},0.4), 0 0 0 1px rgba(${c.rgb},0.1)`,
      }}
    >
      <img
        src={game.cover}
        alt={game.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {/* 渐变遮罩 */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, transparent 40%, rgba(${c.rgb},0.2) 70%, rgba(15,23,42,0.9) 100%)`,
        }}
      />
      {/* 顶部光带 */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.hex}, transparent)`,
        }}
      />
      {/* 内容 */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
        <span className="font-heading text-[10px] tracking-[0.2em] text-white/80">
          精选 · {game.category}
        </span>
        <h3 className="font-display text-2xl font-bold tracking-tight text-white">
          {game.title}
        </h3>
        <div className="mt-1 flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 font-display text-xs font-bold text-white backdrop-blur-md">
            <Star className="h-3 w-3 fill-pink-400 text-pink-400" />
            {game.rating}
          </span>
          <span className="font-heading text-[10px] tracking-wider text-white/70">
            {game.tags.slice(0, 2).join(" · ")}
          </span>
        </div>
      </div>
    </div>
  );
}

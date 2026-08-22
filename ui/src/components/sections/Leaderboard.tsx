/**
 * Leaderboard — 排行榜（亮色蓝调版）
 * Tab 切换（Top / Most Popular / New / Trending）
 * Top1 大卡片 + 2-5 名列表
 * 数字滚动动画（useCountUp）
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Flame, Sparkles, Star, TrendingUp } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { useCountUp } from "@/hooks/useCountUp";
import { accentColorMap, leaderboardData } from "@/lib/data";
import { cardReveal } from "@/lib/motion";
import type { LeaderEntry, LeaderboardTab } from "@/types";

const TABS: { id: LeaderboardTab; label: string; icon: typeof Star }[] = [
  { id: "top", label: "高分榜", icon: Crown },
  { id: "popular", label: "最热门", icon: Flame },
  { id: "new", label: "新上架", icon: Sparkles },
  { id: "trending", label: "上升中", icon: TrendingUp },
];

export default function Leaderboard() {
  const [tab, setTab] = useState<LeaderboardTab>("top");
  const entries = leaderboardData[tab];

  return (
    <section id="leaderboard" className="relative z-10 py-24 md:py-32">
      <div className="container">
        <SectionHeading title="排行榜" align="center" />

        {/* Tabs */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`group relative flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition-all duration-300 ${
                  active
                    ? "border-transparent text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="leaderboard-tab"
                    className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500"
                    style={{ boxShadow: "0 8px 24px -8px rgba(37,99,235,0.5)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <t.icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]"
          >
            {/* Top1 大卡 */}
            <TopCard entry={entries[0]} />

            {/* 2-5 名列表 */}
            <div className="flex flex-col gap-3">
              {entries.slice(1).map((entry, i) => (
                <RankRow
                  key={entry.game.id}
                  entry={entry}
                  index={i + 1}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ============ Top1 Big Card ============ */
function TopCard({ entry }: { entry: LeaderEntry }) {
  const c = accentColorMap[entry.game.accent];
  const isRating = entry.metricLabel === "评分";
  const { ref, display } = useCountUp(entry.metric);
  const href = entry.game.href ?? "#/games/cihai-xunzong";

  return (
    <motion.a
      href={href}
      variants={cardReveal}
      initial="hidden"
      animate="show"
      className="group relative block overflow-hidden rounded-3xl border border-slate-200 bg-white"
      style={{ boxShadow: `0 30px 60px -30px rgba(${c.rgb},0.5)` }}
    >
      {/* 全屏背景图（16:9 横向图正确呈现） */}
      <div className="relative h-[360px] overflow-hidden sm:h-[400px] lg:h-[460px]">
        <img
          src={entry.game.cover}
          alt={entry.game.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        {/* 多层渐变遮罩 */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.65) 35%, rgba(15,23,42,0.25) 70%, rgba(15,23,42,0.4) 100%),
                        linear-gradient(0deg, rgba(15,23,42,0.9) 0%, transparent 55%),
                        radial-gradient(circle at 85% 30%, rgba(${c.rgb},0.25), transparent 55%)`,
          }}
        />
      </div>

      {/* 内容覆盖层 */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 lg:p-10">
        {/* 顶部：Rank + 分类 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Crown
              className="h-8 w-8"
              style={{
                color: "#ffffff",
                fill: `rgba(${c.rgb},0.5)`,
              }}
            />
            <div className="flex flex-col">
              <span className="font-display text-4xl font-black leading-none tabular-nums text-white">
                #01
              </span>
              <span
                className="mt-1 font-heading text-[10px] font-bold tracking-[0.2em]"
                style={{ color: "#ffffff" }}
              >
                {entry.game.category} · {entry.metricLabel}
              </span>
            </div>
          </div>
          {entry.game.isNew && (
            <span
              className="inline-flex items-center gap-1 rounded-full border bg-white/90 px-2.5 py-1 text-[10px] font-bold backdrop-blur-md"
              style={{ color: c.hex, borderColor: `rgba(${c.rgb},0.4)` }}
            >
              <Sparkles className="h-3 w-3" />
              NEW
            </span>
          )}
        </div>

        {/* 底部：标题 + 描述 + 指标 + CTA */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {entry.game.title}
            </h3>
            <p className="max-w-md text-sm text-white/80 sm:text-base">
              {entry.game.description}
            </p>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {entry.game.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[10px] tracking-wider text-white/90 backdrop-blur-md"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-end gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-heading text-[10px] tracking-[0.2em] text-white/70">
                  {entry.metricLabel}
                </span>
                <span
                  ref={ref}
                  className="font-display text-4xl font-black tabular-nums text-white sm:text-5xl"
                >
                  {isRating
                    ? display.toFixed(1)
                    : Math.round(display).toLocaleString()}
                </span>
              </div>
              <span
                className="ripple-host flex items-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-transform group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${c.hex}, #0ea5e9)`,
                  boxShadow: `0 8px 24px -6px rgba(${c.rgb},0.6)`,
                }}
              >
                立即开玩
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

/* ============ Rank Row (2-5) ============ */
function RankRow({ entry, index }: { entry: LeaderEntry; index: number }) {
  const c = accentColorMap[entry.game.accent];
  const isRating = entry.metricLabel === "评分";
  const isPercent = entry.metricLabel.includes("增长");
  const { ref, display } = useCountUp(entry.metric);
  const href = entry.game.href ?? "#/games/cihai-xunzong";

  return (
    <motion.a
      href={href}
      variants={cardReveal}
      initial="hidden"
      animate="show"
      whileHover={{ x: 6 }}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 pr-5 transition-colors hover:border-slate-300"
      style={
        { "--accent": c.hex, "--accent-rgb": c.rgb } as React.CSSProperties
      }
    >
      {/* hover 内辉光 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at right, rgba(${c.rgb},0.1), transparent 60%)`,
        }}
      />

      {/* Rank */}
      <div className="relative w-12 shrink-0 text-center">
        <span className="font-display text-3xl font-black tabular-nums text-slate-200 transition-colors group-hover:text-slate-400">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Cover */}
      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg">
        <img
          src={entry.game.cover}
          alt={entry.game.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 50%, rgba(${c.rgb},0.3))`,
          }}
        />
      </div>

      {/* Title */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-display text-sm font-bold tracking-tight text-slate-900">
          {entry.game.title}
        </span>
        <span className="font-heading text-[10px] tracking-wider text-slate-500">
          {entry.game.category} · ⭐ {entry.game.rating}
        </span>
      </div>

      {/* Metric */}
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span
          ref={ref}
          className="font-display text-lg font-bold tabular-nums"
          style={{ color: c.hex }}
        >
          {isRating
            ? display.toFixed(1)
            : isPercent
            ? `+${Math.round(display)}%`
            : Math.round(display).toLocaleString()}
        </span>
        <span className="font-heading text-[9px] tracking-wider text-slate-400">
          {entry.metricLabel}
        </span>
      </div>
    </motion.a>
  );
}

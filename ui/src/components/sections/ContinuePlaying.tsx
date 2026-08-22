/**
 * ContinuePlaying — 最近游玩（亮色蓝调版）
 * 横向 3 张继续游戏卡 + 进度条 + 继续按钮
 * 若未登录则显示登录引导
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Play, History, LogIn, Clock } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import MagneticButton from "@/components/ui/MagneticButton";
import { accentColorMap, continuePlaying } from "@/lib/data";
import { cardReveal, listStagger, viewportOnce } from "@/lib/motion";

export default function ContinuePlaying() {
  const [loggedIn] = useState(true); // 演示用，默认登录态

  return (
    <section id="recent" className="relative z-10 py-24 md:py-32">
      <div className="container">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading title="最近游玩" />
          {loggedIn && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewportOnce}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5"
            >
              <History className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-heading text-[10px] tracking-[0.2em] text-slate-600">
                3 个存档 · 已同步
              </span>
            </motion.div>
          )}
        </div>

        {!loggedIn ? (
          <NotLoggedInCard />
        ) : (
          <motion.div
            variants={listStagger}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid gap-6 md:grid-cols-3"
          >
            {continuePlaying.map((game) => (
              <motion.div key={game.id} variants={cardReveal}>
                <ContinueCard
                  title={game.title}
                  cover={game.cover}
                  accent={game.accent}
                  progress={game.progress ?? 0}
                  href={game.href ?? "#/games/cihai-xunzong"}
                  lastPlayed={["2 小时前", "昨天", "3 天前"][
                    continuePlaying.indexOf(game) % 3
                  ]}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function ContinueCard({
  title,
  cover,
  accent,
  progress,
  href,
  lastPlayed,
}: {
  title: string;
  cover: string;
  accent: keyof typeof accentColorMap;
  progress: number;
  href: string;
  lastPlayed: string;
}) {
  const c = accentColorMap[accent];

  return (
    <motion.a
      href={href}
      whileHover={{ y: -6 }}
      className="group relative flex min-h-[380px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white"
      style={{ boxShadow: `0 20px 40px -20px rgba(${c.rgb},0.3)` }}
    >
      {/* Cover */}
      <div className="relative h-[200px] shrink-0 overflow-hidden sm:h-[220px]">
        <img
          src={cover}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 30%, rgba(${c.rgb},0.15) 65%, rgba(15,23,42,0.9) 100%)`,
          }}
        />
        {/* Last played */}
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] tracking-wider text-white backdrop-blur-md">
          <Clock className="h-3 w-3" />
          {lastPlayed}
        </span>
        {/* Play button */}
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileHover={{ scale: 1.1 }}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-md"
        >
          <Play className="h-4 w-4 fill-slate-900 text-slate-900" />
        </motion.span>
      </div>

      {/* Info + progress */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-base font-bold tracking-tight text-slate-900">
          {title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="font-heading text-[10px] tracking-wider text-slate-500">
            进度
          </span>
          <span
            className="font-display text-sm font-bold tabular-nums"
            style={{ color: c.hex }}
          >
            {progress}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${progress}%` }}
            viewport={viewportOnce}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${c.hex}, #0ea5e9)`,
            }}
          />
        </div>

        <span
          className="ripple-host mt-auto flex items-center justify-center gap-2 overflow-hidden rounded-xl border py-2.5 text-sm font-medium transition-all"
          style={{
            borderColor: `rgba(${c.rgb},0.3)`,
            background: `rgba(${c.rgb},0.08)`,
            color: c.hex,
          }}
        >
          <Play className="h-4 w-4 fill-current" />
          继续游戏
        </span>
      </div>
    </motion.a>
  );
}

function NotLoggedInCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-12 text-center"
    >
      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500">
          <LogIn className="h-7 w-7 text-white" />
        </div>
        <h3 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          登录后查看
          <span className="gradient-text-soft"> 你的进度</span>
        </h3>
        <p className="text-sm text-slate-600">
          登录账号，跨越设备无缝续玩，所有存档自动同步。
        </p>
        <MagneticButton variant="primary" className="mt-2">
          <LogIn className="h-4 w-4" />
          立即登录
        </MagneticButton>
      </div>
    </motion.div>
  );
}

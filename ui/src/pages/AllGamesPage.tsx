/**
 * AllGamesPage — 全部游戏页面
 *
 * 展示摸鱼舱所有可玩游戏，按分类筛选。
 * 顶部返回摸鱼舱，支持按分类过滤。
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Gamepad2, Play, Star, TrendingUp, Users } from "lucide-react";
import Tilt from "react-parallax-tilt";
import { useNavigate } from "react-router-dom";
import { accentColorMap, popularGames } from "@/lib/data";
import { cardReveal, listStagger, viewportOnce } from "@/lib/motion";
import type { AccentColor, Game } from "@/types";

// 所有可玩游戏（过滤掉占位游戏：href 必须匹配自身 id）
const ALL_GAMES: Game[] = popularGames.filter(
  (g) => g.href === `#/games/${g.id}`,
);

// 从游戏 tags 推导分类
const CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "猜词", label: "猜词" },
  { id: "数独", label: "数独" },
  { id: "社交推理", label: "社交推理" },
  { id: "文字模拟", label: "文字模拟" },
];

export default function AllGamesPage() {
  const [cat, setCat] = useState<string>("all");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (cat === "all") return ALL_GAMES;
    return ALL_GAMES.filter((g) => g.category === cat);
  }, [cat]);

  return (
    <div className="relative min-h-screen pb-20">
      {/* 背景：蓝色调光晕，匹配网站主题 */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-blue-200/30 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[460px] rounded-full bg-sky-200/20 blur-[100px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        {/* 返回 + 标题 */}
        <button
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3.5 py-2 text-xs text-slate-600 backdrop-blur-md transition-colors hover:border-blue-300 hover:text-blue-700 sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          摸鱼舱
        </button>

        {/* 标题区 */}
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
            <Gamepad2 className="h-3.5 w-3.5 text-blue-700" />
            <span className="font-heading text-[10px] font-bold tracking-[0.25em] text-blue-700">
              GAME LIBRARY
            </span>
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            全部<span className="gradient-text">游戏</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            共 {ALL_GAMES.length} 款游戏 · 上班摸鱼必备
          </p>
        </div>

        {/* 分类筛选 */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={
                  "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all " +
                  (active
                    ? "border-blue-300 bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:border-blue-300 hover:text-blue-700")
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* 游戏网格 */}
        <motion.div
          key={cat}
          variants={listStagger}
          initial="hidden"
          animate="show"
          viewport={viewportOnce}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6"
        >
          {filtered.map((game, i) => (
            <motion.div key={game.id} variants={cardReveal}>
              <GameCardLarge game={game} index={i} />
            </motion.div>
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Gamepad2 className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">该分类下暂无游戏</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ 大尺寸游戏卡片 ============ */

function GameCardLarge({ game, index }: { game: Game; index: number }) {
  const c = accentColorMap[game.accent as AccentColor];

  return (
    <a href={game.href} className="block h-full w-full cursor-pointer">
      <Tilt
        tiltMaxAngleX={4}
        tiltMaxAngleY={4}
        scale={1.02}
        transitionSpeed={1500}
        transitionEasing="cubic-bezier(0.22, 1, 0.36, 1)"
        glareEnable
        glareMaxOpacity={0.12}
        glareColor={`rgb(${c.rgb})`}
        glarePosition="all"
        style={{ width: "100%", height: "100%" }}
      >
        <motion.article
          data-card
          whileHover="hover"
          className="group relative h-[440px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white sm:h-[460px]"
          style={{
            boxShadow: `0 20px 40px -20px rgba(${c.rgb},0.3)`,
          }}
        >
          {/* 封面 */}
          <div className="relative h-[280px] overflow-hidden sm:h-[300px]">
            <motion.img
              src={game.cover}
              alt={game.title}
              loading="lazy"
              variants={{ hover: { scale: 1.08 } }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full object-cover"
            />
            {/* 底部圆形光晕 */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(ellipse 80% 100% at 50% 100%, rgba(${c.rgb},0.45) 0%, rgba(${c.rgb},0.18) 40%, transparent 75%)`,
              }}
            />
            {/* 底部基础渐变 */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
              style={{
                background: `linear-gradient(180deg, transparent, rgba(15,23,42,0.85) 100%)`,
              }}
            />

            {/* 顶部 tag 行：HOT + 评分 */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
              <span
                className="inline-flex items-center gap-1 rounded-full border bg-white/90 px-2.5 py-1 text-[10px] font-bold backdrop-blur-md"
                style={{ color: c.hex, borderColor: `rgba(${c.rgb},0.4)` }}
              >
                <TrendingUp className="h-3 w-3" />
                HOT
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums text-white backdrop-blur-md"
                style={{ background: `rgba(${c.rgb},0.85)` }}
              >
                <Star className="h-3 w-3 fill-white text-white" />
                {game.rating}
              </span>
            </div>

            {/* Hover 时浮现的 Play 按钮 */}
            <motion.div
              variants={{ hover: { opacity: 1, y: 0 } }}
              initial={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.4 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <button className="ripple-host flex h-16 w-16 items-center justify-center rounded-full bg-white/90 backdrop-blur-md transition-all hover:scale-110 shadow-lg">
                <div
                  className="absolute inset-0 rounded-full opacity-50 blur-md"
                  style={{ background: `rgba(${c.rgb},0.6)` }}
                />
                <Play className="relative h-6 w-6 fill-slate-900 text-slate-900" />
              </button>
            </motion.div>
          </div>

          {/* 底部信息 */}
          <div className="relative flex flex-col gap-2.5 p-5">
            <div className="flex items-center justify-between">
              <span
                className="font-heading text-[10px] font-bold tracking-[0.15em]"
                style={{ color: c.hex }}
              >
                {game.category}
              </span>
              <span className="font-heading text-[10px] tracking-wider text-slate-400">
                #{String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {game.title}
            </h3>
            <p className="line-clamp-2 text-xs text-slate-500">
              {game.description}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span className="tabular-nums">
                  {Math.round(game.players / 1000)}K
                </span>
                <span className="text-slate-400">在线</span>
              </span>
              <span className="h-3 w-px bg-slate-200" />
              <span className="inline-flex items-center gap-1">
                {game.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                  >
                    {t}
                  </span>
                ))}
              </span>
            </div>
          </div>

          {/* Hover 边框显现 */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              boxShadow: `inset 0 0 0 1px rgba(${c.rgb},0.5), 0 0 30px rgba(${c.rgb},0.2)`,
            }}
          />
        </motion.article>
      </Tilt>
    </a>
  );
}

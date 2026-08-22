/**
 * PopularGames — 热门游戏（亮色蓝调版）
 * 固定 4 张卡片网格布局，Tilt + Hover 缩放
 * 卡片：封面 / 评分 / 在线人数 / 分类 / 开始游戏按钮
 */
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { ChevronRight, Gamepad2, Play, Star, TrendingUp, Users } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { accentColorMap, popularGames } from "@/lib/data";
import { cardReveal, listStagger, viewportOnce } from "@/lib/motion";
import type { Game } from "@/types";

// 只取前 4 个（词海寻踪已置顶）
const GAMES = popularGames.slice(0, 4);

export default function PopularGames() {
  return (
    <section id="popular" className="relative z-10 py-24 md:py-32">
      <div className="container">
        {/* 标题 */}
        <SectionHeading title="热门游戏" />

        {/* 4 张卡片网格 */}
        <motion.div
          variants={listStagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-6"
        >
          {GAMES.map((game, i) => (
            <motion.div key={game.id} variants={cardReveal}>
              <GameCard game={game} index={i} />
            </motion.div>
          ))}
        </motion.div>

        {/* 全部游戏入口 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-10 flex justify-center"
        >
          <a
            href="#/games"
            className="ripple-host group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/80 px-6 py-3 text-sm font-semibold text-blue-700 backdrop-blur-md transition-all hover:border-blue-300 hover:bg-blue-100 sm:text-base"
          >
            <Gamepad2 className="h-4 w-4" />
            <span>进入全部游戏</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ GameCard ============ */

function GameCard({ game, index }: { game: Game; index: number }) {
  const c = accentColorMap[game.accent];
  const Wrapper = game.href ? "a" : "div";
  const wrapperProps = game.href ? { href: game.href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="block h-full w-full cursor-pointer"
    >
      <Tilt
        tiltMaxAngleX={5}
        tiltMaxAngleY={5}
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
          className="group relative h-[420px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white sm:h-[440px] lg:h-[460px]"
          style={{
            boxShadow: `0 20px 40px -20px rgba(${c.rgb},0.3)`,
          }}
        >
          {/* 封面 */}
          <div className="relative h-[270px] overflow-hidden sm:h-[290px] lg:h-[310px]">
            <motion.img
              src={game.cover}
              alt={game.title}
              loading="lazy"
              variants={{ hover: { scale: 1.08 } }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full object-cover"
            />
            {/* 底部圆形光晕（替代原方形渐变，hover 时显现） */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(ellipse 80% 100% at 50% 100%, rgba(${c.rgb},0.45) 0%, rgba(${c.rgb},0.18) 40%, transparent 75%)`,
              }}
            />
            {/* 底部基础渐变（保证文字可读） */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
              style={{
                background: `linear-gradient(180deg, transparent, rgba(15,23,42,0.85) 100%)`,
              }}
            />

            {/* 顶部 tag 行 */}
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
          <div className="relative flex flex-col gap-2.5 p-4 sm:p-5">
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
            <h3 className="font-display text-base font-bold tracking-tight text-slate-900 sm:text-lg md:text-xl">
              {game.title}
            </h3>
            <p className="line-clamp-1 text-xs text-slate-500">
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
    </Wrapper>
  );
}

/**
 * PopularNovels — 热门小说（亮色蓝调版）
 *
 * 从本地 epub 书架取前 4 本，用与「热门游戏」一致的卡片样式展示。
 * 卡片背景为书籍封面图，点击跳转到小说阅读页。
 */
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { BookOpen, ChevronRight, Library, Play, Star } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { LOCAL_NOVELS, type LocalNovelMeta } from "@/lib/classicNovels";
import { cardReveal, listStagger, viewportOnce } from "@/lib/motion";

// 只取前 4 本，并附上评分（模拟数据，用于卡片右上角展示）
interface NovelCardMeta extends LocalNovelMeta {
  rating: number;
}

const NOVELS: NovelCardMeta[] = LOCAL_NOVELS.slice(0, 4).map((n, i) => ({
  ...n,
  // 按顺序给出 9.7 / 9.5 / 9.4 / 9.2 的评分
  rating: [9.7, 9.5, 9.4, 9.2][i] ?? 9.0,
}));

export default function PopularNovels() {
  return (
    <section id="novels" className="relative z-10 py-24 md:py-32">
      <div className="container">
        {/* 标题 */}
        <SectionHeading title="热门小说" />

        {/* 4 张卡片网格 */}
        <motion.div
          variants={listStagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-6"
        >
          {NOVELS.map((novel, i) => (
            <motion.div key={novel.id} variants={cardReveal}>
              <NovelCard novel={novel} index={i} />
            </motion.div>
          ))}
        </motion.div>

        {/* 全部书架入口（蓝色风格，匹配网站主题） */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-10 flex justify-center"
        >
          <a
            href="#/novels"
            className="ripple-host group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/80 px-6 py-3 text-sm font-semibold text-blue-700 backdrop-blur-md transition-all hover:border-blue-300 hover:bg-blue-100 sm:text-base"
          >
            <Library className="h-4 w-4" />
            <span>进入摸鱼书房</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ NovelCard ============ */

function NovelCard({ novel, index }: { novel: NovelCardMeta; index: number }) {
  // 书籍主色（兜底色）
  const accentHex = novel.color;
  const accentRgb = hexToRgb(accentHex);

  return (
    <a
      href="#/novels"
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
        glareColor={`rgb(${accentRgb})`}
        glarePosition="all"
        style={{ width: "100%", height: "100%" }}
      >
        <motion.article
          data-card
          whileHover="hover"
          className="group relative h-[420px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white sm:h-[440px] lg:h-[460px]"
          style={{
            boxShadow: `0 20px 40px -20px rgba(${accentRgb},0.3)`,
          }}
        >
          {/* 封面 */}
          <div className="relative h-[270px] overflow-hidden sm:h-[290px] lg:h-[310px]">
            {/* 图像外层做 5% overscan，避免封面自带白边漏出 */}
            <div className="absolute inset-[-5%]">
              <motion.img
                src={`${import.meta.env.BASE_URL}${novel.cover}`}
                alt={novel.title}
                loading="lazy"
                variants={{ hover: { scale: 1.08 } }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // 封面加载失败时用兜底色
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            {/* 兜底背景色（封面加载中或失败时显示） */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background: `linear-gradient(135deg, ${accentHex} 0%, ${accentHex}99 100%)`,
              }}
            />
            {/* 底部圆形光晕（替代原方形渐变，hover 时显现） */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(ellipse 80% 100% at 50% 100%, rgba(${accentRgb},0.45) 0%, rgba(${accentRgb},0.18) 40%, transparent 75%)`,
              }}
            />
            {/* 底部基础渐变（保证文字可读） */}
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
                style={{ color: accentHex, borderColor: `rgba(${accentRgb},0.4)` }}
              >
                <BookOpen className="h-3 w-3" />
                HOT
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums text-white backdrop-blur-md"
                style={{ background: `rgba(${accentRgb},0.85)` }}
              >
                <Star className="h-3 w-3 fill-white text-white" />
                {novel.rating}
              </span>
            </div>

            {/* Hover 时浮现的阅读按钮 */}
            <motion.div
              variants={{ hover: { opacity: 1, y: 0 } }}
              initial={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.4 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <button className="ripple-host flex h-16 w-16 items-center justify-center rounded-full bg-white/90 backdrop-blur-md transition-all hover:scale-110 shadow-lg">
                <div
                  className="absolute inset-0 rounded-full opacity-50 blur-md"
                  style={{ background: `rgba(${accentRgb},0.6)` }}
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
                style={{ color: accentHex }}
              >
                {novel.author.length > 12
                  ? novel.author.slice(0, 12) + "…"
                  : novel.author}
              </span>
              <span className="font-heading text-[10px] tracking-wider text-slate-400">
                #{String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="font-display text-base font-bold tracking-tight text-slate-900 sm:text-lg md:text-xl line-clamp-1">
              {novel.title}
            </h3>
            <p className="line-clamp-2 text-xs text-slate-500">
              {novel.summary}
            </p>
          </div>

          {/* Hover 边框显现 */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              boxShadow: `inset 0 0 0 1px rgba(${accentRgb},0.5), 0 0 30px rgba(${accentRgb},0.2)`,
            }}
          />
        </motion.article>
      </Tilt>
    </a>
  );
}

/** hex → "r,g,b" 字符串 */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

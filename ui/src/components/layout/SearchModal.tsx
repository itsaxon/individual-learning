/**
 * SearchModal — 全局搜索弹窗
 *
 * 可搜索游戏（来自 popularGames）和小说（来自 LOCAL_NOVELS）。
 * 支持按标题、分类、标签、作者模糊匹配。
 * 点击结果直接跳转。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Gamepad2, Search, X } from "lucide-react";
import { popularGames } from "@/lib/data";
import { LOCAL_NOVELS } from "@/lib/classicNovels";

interface SearchItem {
  id: string;
  type: "game" | "novel";
  title: string;
  subtitle: string;
  description: string;
  cover: string;
  href: string;
  tags: string[];
}

function buildIndex(): SearchItem[] {
  const games: SearchItem[] = popularGames.map((g) => ({
    id: `game-${g.id}`,
    type: "game",
    title: g.title,
    subtitle: g.category,
    description: g.description,
    cover: g.cover,
    href: g.href,
    tags: g.tags,
  }));
  const novels: SearchItem[] = LOCAL_NOVELS.map((n) => ({
    id: `novel-${n.id}`,
    type: "novel",
    title: n.title,
    subtitle: n.author,
    description: n.summary,
    cover: `${import.meta.env.BASE_URL}${n.cover}`,
    href: "#/novels",
    tags: ["小说", "epub"],
  }));
  return [...games, ...novels];
}

const INDEX = buildIndex();

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 打开时自动聚焦
  useEffect(() => {
    if (open) {
      setQuery("");
      // 延迟聚焦以确保 DOM 已渲染
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // 锁定背景滚动
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // 搜索过滤
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return INDEX.filter((item) => {
      const haystack = [
        item.title,
        item.subtitle,
        item.description,
        item.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    }).slice(0, 12);
  }, [query]);

  // 分组
  const gameResults = results.filter((r) => r.type === "game");
  const novelResults = results.filter((r) => r.type === "novel");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300] flex items-start justify-center p-4 pt-[10vh]"
        >
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 弹窗 */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* 顶部：搜索框 */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索游戏或小说…"
                className="flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 结果区 */}
            <div className="max-h-[60vh] overflow-y-auto">
              {!query.trim() ? (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                    <Search className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-slate-900">
                      搜索摸鱼舱
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      输入游戏名、小说名、作者或分类，快速找到你想摸的鱼
                    </p>
                  </div>
                  {/* 快捷标签 */}
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {["猜词", "数独", "推理", "小说", "修仙"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setQuery(tag)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <X className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-slate-900">
                      没找到「{query}」
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      试试其他关键词，或浏览首页热门推荐
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  {/* 游戏结果 */}
                  {gameResults.length > 0 && (
                    <ResultGroup
                      label="游戏"
                      icon={Gamepad2}
                      items={gameResults}
                      onClose={onClose}
                    />
                  )}
                  {/* 小说结果 */}
                  {novelResults.length > 0 && (
                    <ResultGroup
                      label="小说"
                      icon={BookOpen}
                      items={novelResults}
                      onClose={onClose}
                    />
                  )}
                </div>
              )}
            </div>

            {/* 底部提示 */}
            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-2.5">
              <p className="text-[10px] tracking-wider text-slate-400">
                按 ESC 关闭 · 输入关键词搜索
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============ 结果分组 ============ */
function ResultGroup({
  label,
  icon: Icon,
  items,
  onClose,
}: {
  label: string;
  icon: typeof Gamepad2;
  items: SearchItem[];
  onClose: () => void;
}) {
  return (
    <div className="px-2">
      <div className="flex items-center gap-2 px-3 py-2">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-heading text-[10px] font-bold tracking-[0.2em] text-slate-500">
          {label}
        </span>
        <span className="text-[10px] text-slate-400">({items.length})</span>
      </div>
      <div className="flex flex-col">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            onClick={onClose}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-blue-50/60"
          >
            {/* 封面缩略图 */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <img
                src={item.cover}
                alt={item.title}
                loading="lazy"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            {/* 文字 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-display text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  {item.title}
                </span>
                <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600">
                  {item.subtitle}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {item.description}
              </p>
            </div>
            {/* 标签 */}
            <div className="hidden shrink-0 items-center gap-1 sm:flex">
              {item.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500"
                >
                  {t}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

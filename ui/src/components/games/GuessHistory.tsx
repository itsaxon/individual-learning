/**
 * GuessHistory — 游戏轨迹容器
 *
 * 右栏滚动列表，承载所有 GuessCard：
 *   - 标题栏：王冠 + 「游戏轨迹」+ 计数
 *   - 列表区：固定高度，内部滚动（data-lenis-prevent 防 Lenis 劫持）
 *   - 空状态：引导文案
 *   - 新增时自动滚动到底部（其实最佳置顶，滚到最新条目）
 */
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Target } from "lucide-react";
import GuessCard from "./GuessCard";

export interface GuessItem {
  id: number;
  word: string;
  similarity: number;
  ts: number;
}

interface Props {
  items: GuessItem[];
  /** 本次刚提交的 id（用于高亮） */
  lastSubmittedId: number | null;
}

export default function GuessHistory({ items, lastSubmittedId }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  // 新增时滚到最新条目位置（按相似度排序后，最新可能在中间或顶部）
  useEffect(() => {
    if (!listRef.current || items.length === 0) return;
    // 找到最新条目的元素
    const latest = items.reduce((a, b) => (a.ts > b.ts ? a : b));
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-guess-id="${latest.id}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [items]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 backdrop-blur-xl">
      {/* 标题栏 */}
      <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          <span className="font-display text-sm font-bold text-slate-900">
            游戏轨迹
          </span>
        </div>
        <span className="font-heading text-[10px] tracking-[0.2em] text-slate-400">
          {items.length > 0 ? `${items.length} 条 · 按相关度` : "空"}
        </span>
      </div>

      {/* 列表区 */}
      <div
        ref={listRef}
        data-lenis-prevent
        className="flex-1 overflow-y-auto p-3"
      >
        {items.length === 0 ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <Target className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">
                还没有猜测记录
              </p>
              <p className="mt-1 text-xs text-slate-400">
                输入一个词，开始你的推理之旅
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {items.map((g, i) => (
                <div key={g.id} data-guess-id={g.id}>
                  <GuessCard
                    word={g.word}
                    similarity={g.similarity}
                    rank={i}
                    index={i}
                    isNew={lastSubmittedId === g.id}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

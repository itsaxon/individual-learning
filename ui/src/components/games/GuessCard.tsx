/**
 * GuessCard — 游戏轨迹卡片（游戏化版）
 *
 * 每次猜测是一张卡片，按热度分级呈现：
 *   - 95+：金色光效（边框光晕 + 微脉冲）
 *   - 80-95：紫色光效
 *   - 60-80：橙色
 *   - 30-60：绿色（普通）
 *   - <30：灰色冷色调
 *
 * 卡片左侧：emoji + 排名
 * 中间：词语 + 状态文案
 * 右侧：大百分比 + 渐变进度条
 *
 * 新卡片从底部滑入（layout 动画驱动排序平滑过渡）。
 */
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { heatTier } from "@/lib/gameTiers";

interface Props {
  word: string;
  similarity: number;
  /** 列表中的排名（0=最佳） */
  rank: number;
  /** 序号（用于显示） */
  index: number;
  /** 是否本次刚提交（触发高亮） */
  isNew?: boolean;
}

export default function GuessCard({
  word,
  similarity,
  rank,
  index,
  isNew,
}: Props) {
  const tier = heatTier(similarity);
  const isBest = rank === 0;
  const v = Math.max(0, Math.min(100, similarity));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="relative overflow-hidden rounded-2xl border bg-white/85 backdrop-blur-md"
      style={{
        borderColor: isBest
          ? `rgba(${tier.rgb},0.5)`
          : `rgba(${tier.rgb},0.25)`,
        borderLeft: `3px solid ${tier.color}`,
        boxShadow: isNew
          ? `0 0 0 2px rgba(${tier.rgb},0.35), 0 10px 28px -10px rgba(${tier.rgb},0.5)`
          : isBest && tier.hot
          ? `0 0 24px -8px rgba(${tier.rgb},0.45)`
          : `0 4px 14px -8px rgba(15,23,42,0.1)`,
      }}
    >
      {/* 高相关度背景光晕 */}
      {tier.hot && (
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, rgba(${tier.rgb},0.25), transparent 70%)`,
          }}
        />
      )}

      <div className="relative flex items-center gap-3 px-4 py-3">
        {/* 左：emoji + 排名 */}
        <div className="flex w-8 shrink-0 flex-col items-center gap-0.5">
          {isBest ? (
            <Crown
              className="h-5 w-5"
              style={{ color: tier.color, fill: `rgba(${tier.rgb},0.25)` }}
            />
          ) : (
            <span className="font-mono text-[10px] font-bold tabular-nums text-slate-400">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
        </div>

        {/* 中：词语 + 状态 */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className="truncate font-display text-base font-bold text-slate-900"
            title={word}
          >
            {word}
          </span>
          <span
            className="text-[11px] font-medium"
            style={{ color: tier.color }}
          >
            {tier.emoji} {tier.status}
          </span>
        </div>

        {/* 右：百分比 */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className="font-mono text-lg font-black leading-none tabular-nums"
            style={{ color: tier.color }}
          >
            {v.toFixed(2)}
            <span className="text-xs">%</span>
          </span>
        </div>
      </div>

      {/* 底部进度条 */}
      <div className="h-1 w-full bg-slate-100">
        <motion.div
          className="h-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, v)}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: `linear-gradient(90deg, rgba(${tier.rgb},0.5), ${tier.color})`,
          }}
        />
      </div>
    </motion.div>
  );
}

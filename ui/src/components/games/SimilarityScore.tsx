/**
 * SimilarityScore — 游戏主舞台
 *
 * 展示当前最佳相关度，是整个游戏的视觉焦点：
 *   - 巨大数字（带滚动动画，每次 best 变化都从旧值滚到新值）
 *   - 动态状态文案 + HeatIndicator 徽章
 *   - 0-100 进度条（带光点指示器）
 *   - 「方向距离」条：你的方向 ████░░
 *   - 趋势图（最近 10 次猜测）
 *
 * 高相关度时整体带光效脉冲；猜中时金色庆祝。
 */
import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { heatTier, directionText } from "@/lib/gameTiers";
import HeatIndicator from "./HeatIndicator";
import TrendChart from "./TrendChart";

interface Props {
  /** 当前最佳相关度 0-100 */
  value: number;
  /** 按提交时间升序的相关度序列（用于趋势图） */
  trend: number[];
  /** 是否正在加载目标词 */
  loading?: boolean;
  /** 是否已猜中 */
  won?: boolean;
  /** 是否首次猜测前 */
  empty?: boolean;
}

/** 数字滚动：value 变化时从旧值平滑过渡到新值 */
function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 70, damping: 20 });
  const text = useTransform(spring, (v) => v.toFixed(2));

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  return (
    <motion.span className="tabular-nums">{text}</motion.span>
  );
}

export default function SimilarityScore({
  value,
  trend,
  loading,
  won,
  empty,
}: Props) {
  const v = Math.max(0, Math.min(100, value));
  const tier = heatTier(v);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-600" />
        <span className="font-heading text-xs tracking-[0.25em] text-slate-500">
          正在抽取今日词语…
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-5">
      {/* 高相关度光晕（背景脉冲） */}
      {tier.hot && !empty && (
        <motion.div
          className="pointer-events-none absolute -top-10 h-64 w-64 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(${tier.rgb},0.25), transparent 70%)` }}
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* 巨大数字 */}
      <div className="relative flex items-baseline gap-1">
        <motion.div
          key={`num-${tier.min}`}
          initial={empty ? false : { scale: 0.85, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
          className="font-display font-black leading-none"
          style={{
            fontSize: "clamp(3rem, 10vw, 5rem)",
            color: empty ? "#94a3b8" : tier.color,
            textShadow: won
              ? `0 0 40px rgba(245,158,11,0.5)`
              : tier.hot
              ? `0 0 30px rgba(${tier.rgb},0.35)`
              : "none",
          }}
        >
          {empty ? (
            <span className="text-slate-300">??</span>
          ) : (
            <AnimatedNumber value={v} />
          )}
        </motion.div>
        {!empty && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-display text-2xl font-bold"
            style={{ color: tier.color }}
          >
            %
          </motion.span>
        )}
      </div>

      {/* 状态文案 + 热度徽章 */}
      {!empty && (
        <motion.div
          key={`status-${tier.min}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2.5"
        >
          <HeatIndicator value={v} />
          <p className="font-heading text-sm font-medium tracking-wide text-slate-600">
            {tier.emoji} {tier.status}
          </p>
        </motion.div>
      )}

      {/* 进度条 0 ----- 100 */}
      <div className="relative mt-2 w-full max-w-xl px-2">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
          {/* 频谱渐变底 */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "linear-gradient(90deg, #38bdf8 0%, #10b981 30%, #f97316 60%, #8b5cf6 80%, #f59e0b 100%)",
            }}
          />
          {/* 已填充 */}
          {!empty && (
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(1.5, v)}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 18 }}
              style={{
                background: `linear-gradient(90deg, rgba(${tier.rgb},0.5), ${tier.color})`,
              }}
            />
          )}
        </div>
        {/* 光点指示器（中心对齐到 v%） */}
        {!empty && (
          <motion.div
            className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white"
            initial={{ left: "0%" }}
            animate={{ left: `${v}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 18 }}
            style={{
              borderColor: tier.color,
              boxShadow: `0 0 0 1px rgba(${tier.rgb},0.25), 0 0 12px rgba(${tier.rgb},0.5)`,
            }}
          >
            <span
              className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: tier.color }}
            />
          </motion.div>
        )}
        {/* 刻度：每个数字对齐到真实百分比位置，与光点指示器一致 */}
        <div className="relative mt-2 h-4 w-full font-mono text-[9px] tabular-nums text-slate-400">
          <span className="absolute left-0 top-0">0</span>
          <span className="absolute left-1/4 top-0 -translate-x-1/2">25</span>
          <span className="absolute left-1/2 top-0 -translate-x-1/2">50</span>
          <span className="absolute left-3/4 top-0 -translate-x-1/2">75</span>
          <span className="absolute right-0 top-0">100</span>
        </div>
      </div>

      {/* 方向距离条 */}
      {!empty && (
        <div className="mt-1 flex w-full max-w-xl flex-col items-center gap-1.5 px-2">
          <div className="flex w-full items-center justify-between">
            <span className="font-heading text-[10px] tracking-[0.2em] text-slate-500">
              距离答案
            </span>
            <span
              className="font-mono text-[10px] font-bold tabular-nums"
              style={{ color: tier.color }}
            >
              {directionText(v)}
            </span>
          </div>
        </div>
      )}

      {/* 趋势图 */}
      {!empty && (
        <div className="mt-4 w-full max-w-xl rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-3 backdrop-blur-sm">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-heading text-[10px] tracking-[0.2em] text-slate-500">
              猜测趋势
            </span>
            <span className="font-mono text-[10px] tabular-nums text-slate-400">
              最近 {Math.min(trend.length, 10)} 次
            </span>
          </div>
          <TrendChart data={trend} />
        </div>
      )}

      {/* 图例 */}
      {empty && (
        <HeatIndicator value={0} variant="legend" animate={false} />
      )}
    </div>
  );
}

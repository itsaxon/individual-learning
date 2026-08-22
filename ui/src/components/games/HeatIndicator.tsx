/**
 * HeatIndicator — 热度等级徽章
 *
 * 根据相似度展示对应的热度等级（emoji + 标签），
 * 带温度计式的视觉强度（颜色填充 + 微光）。
 *
 * 用途：
 *   - 嵌入 SimilarityScore 下方
 *   - 嵌入 GuessCard 角标
 *   - 作为图例展示（variant="legend"）
 */
import { motion } from "framer-motion";
import { ALL_HEAT_TIERS, heatTier } from "@/lib/gameTiers";

interface Props {
  value: number;
  variant?: "badge" | "legend";
  animate?: boolean;
}

export default function HeatIndicator({
  value,
  variant = "badge",
  animate = true,
}: Props) {
  const tier = heatTier(value);

  if (variant === "legend") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        {ALL_HEAT_TIERS.map((t) => {
          const active = t.min === tier.min;
          return (
            <div
              key={t.min}
              className="flex items-center gap-1.5 transition-opacity"
              style={{ opacity: active ? 1 : 0.4 }}
            >
              <span className="text-xs">{t.emoji}</span>
              <span
                className="font-heading text-[10px] font-medium tracking-wider"
                style={{ color: t.color }}
              >
                {t.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // badge 模式
  return (
    <motion.div
      key={tier.min}
      initial={animate ? { scale: 0.6, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5"
      style={{
        borderColor: `rgba(${tier.rgb},0.4)`,
        background: `rgba(${tier.rgb},0.1)`,
        boxShadow: tier.hot ? `0 0 18px -4px rgba(${tier.rgb},0.5)` : "none",
      }}
    >
      <motion.span
        className="text-base"
        animate={
          animate && tier.hot
            ? { scale: [1, 1.15, 1] }
            : { scale: 1 }
        }
        transition={{
          duration: 1.4,
          repeat: tier.hot ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {tier.emoji}
      </motion.span>
      <span
        className="font-heading text-xs font-bold tracking-[0.15em]"
        style={{ color: tier.color }}
      >
        {tier.label}
      </span>
    </motion.div>
  );
}

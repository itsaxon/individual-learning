/**
 * gameTiers — 游戏化热度分级系统
 *
 * 根据相关度返回对应的热度等级，用于：
 *   - SimilarityScore 大数字下方的动态状态
 *   - GuessCard 卡片视觉（颜色/光效/emoji）
 *   - HeatIndicator 徽章
 *
 * 分级（参考用户规格）：
 *   0-30   ❄️ 寒冷区域
 *   30-60  🌱 有感觉
 *   60-80  🔥 接近
 *   80-95  🚀 非常接近
 *   95+    🏆 找到了
 */

export interface HeatTier {
  /** 分级下限（含） */
  min: number;
  /** emoji 图标 */
  emoji: string;
  /** 简短标签 */
  label: string;
  /** 动态状态文案（用于大数字下方） */
  status: string;
  /** 主色 hex */
  color: string;
  /** 主色 rgb（用于 rgba） */
  rgb: string;
  /** 是否高相关度（触发光效/粒子） */
  hot: boolean;
}

const TIERS: HeatTier[] = [
  {
    min: 95,
    emoji: "🏆",
    label: "找到了",
    status: "几乎就是它了",
    color: "#f59e0b",
    rgb: "245,158,11",
    hot: true,
  },
  {
    min: 80,
    emoji: "🚀",
    label: "非常接近",
    status: "非常接近，再加把劲",
    color: "#8b5cf6",
    rgb: "139,92,246",
    hot: true,
  },
  {
    min: 60,
    emoji: "🔥",
    label: "接近",
    status: "方向很对，继续逼近",
    color: "#f97316",
    rgb: "249,115,22",
    hot: true,
  },
  {
    min: 30,
    emoji: "🌱",
    label: "有感觉",
    status: "有些联系，再想想",
    color: "#10b981",
    rgb: "16,185,129",
    hot: false,
  },
  {
    min: 0,
    emoji: "❄️",
    label: "寒冷",
    status: "还差得远，换个方向",
    color: "#38bdf8",
    rgb: "56,189,248",
    hot: false,
  },
];

/** 根据相似度（0-100）返回对应热度等级 */
export function heatTier(sim: number): HeatTier {
  const v = Math.max(0, Math.min(100, sim));
  return TIERS.find((t) => v >= t.min) ?? TIERS[TIERS.length - 1];
}

/** 全部等级（用于图例展示，从低到高：❄️ → 🌱 → 🔥 → 🚀 → 🏆） */
export const ALL_HEAT_TIERS = [...TIERS].reverse();

/**
 * 方向距离文案 —— 根据「当前最佳」与「历史最佳对比」给出方向感
 * 这里简单根据相似度区间给出鼓励性方向文案
 */
export function directionText(sim: number): string {
  if (sim >= 95) return "就在眼前，最后一步";
  if (sim >= 80) return "继续沿这个方向探索";
  if (sim >= 60) return "温度在升，保持方向";
  if (sim >= 30) return "有点感觉，再发散一下";
  return "换个完全不同的方向试试";
}

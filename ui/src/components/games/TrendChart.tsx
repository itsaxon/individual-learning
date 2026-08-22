/**
 * TrendChart — 最近猜测趋势图（SVG sparkline）
 *
 * 展示最近 N 次猜测的相关度变化曲线，让用户感知「方向是否正确」。
 * - 折线 + 渐变填充
 * - 每个数据点带光晕（高相关度点更亮）
 * - 末端点带脉冲动画
 * - 空状态：提示文字
 */
import { motion } from "framer-motion";
import { heatTier } from "@/lib/gameTiers";

interface Props {
  /** 最近猜测的相关度序列（按提交时间升序） */
  data: number[];
  /** 最多展示多少个点，默认 10 */
  maxPoints?: number;
}

const W = 260;
const H = 70;
const PAD = 6;

export default function TrendChart({ data, maxPoints = 10 }: Props) {
  const series = data.slice(-maxPoints);

  if (series.length < 2) {
    return (
      <div className="flex h-[70px] w-full items-center justify-center">
        <span className="font-heading text-[10px] tracking-[0.2em] text-slate-400">
          猜测 2 次以上显示趋势
        </span>
      </div>
    );
  }

  const min = 0;
  const max = 100;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;

  const points = series.map((v, i) => {
    const x = PAD + i * stepX;
    const y = PAD + innerH - ((v - min) / (max - min)) * innerH;
    return { x, y, v };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD + innerH} L ${points[0].x} ${PAD + innerH} Z`;

  const last = points[points.length - 1];
  const lastTier = heatTier(last.v);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[70px] w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trend-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor={lastTier.color} />
          </linearGradient>
        </defs>

        {/* 网格基线 */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={PAD}
            x2={W - PAD}
            y1={PAD + innerH * g}
            y2={PAD + innerH * g}
            stroke="rgba(148,163,184,0.18)"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
        ))}

        {/* 填充区域 */}
        <motion.path
          d={areaPath}
          fill="url(#trend-area)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* 折线 */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="url(#trend-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* 数据点 */}
        {points.map((p, i) => {
          const t = heatTier(p.v);
          const isLast = i === points.length - 1;
          return (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isLast ? 4 : 2.5}
              fill={t.color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.04 }}
              style={
                isLast
                  ? { filter: `drop-shadow(0 0 4px ${t.color})` }
                  : undefined
              }
            />
          );
        })}

        {/* 末端脉冲 */}
        <circle
          cx={last.x}
          cy={last.y}
          r="4"
          fill="none"
          stroke={lastTier.color}
          strokeWidth="1.5"
          opacity="0.6"
        >
          <animate
            attributeName="r"
            values="4;10;4"
            dur="1.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.6;0;0.6"
            dur="1.8s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}

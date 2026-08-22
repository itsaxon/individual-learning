/**
 * SimilarityBar — 横向相关度频谱条（亮色版）
 *
 *   - 全宽横向轨道，冷→热渐变背景示意全频谱
 *   - 静态填充条 + 指示器标记当前相似度位置
 *   - 大数字 + 分级标签居中展示
 *   - 底部刻度与分级语义对照
 *
 * 颜色分级（亮色背景用更深的色调保证对比度）：
 *   0% 天蓝 / 35% 靛蓝 / 70% 紫罗兰 / 100% 翡翠绿
 */
interface Props {
  /** 0-100 */
  value: number;
}

/** 根据相似度返回主色和文字标签 */
export function simTier(sim: number): {
  color: string;
  rgb: string;
  label: string;
} {
  if (sim >= 99) return { color: "#059669", rgb: "5,150,105", label: "命中" };
  if (sim >= 70) return { color: "#7c3aed", rgb: "124,58,237", label: "逼近" };
  if (sim >= 35) return { color: "#4f46e5", rgb: "79,70,229", label: "接近" };
  if (sim >= 10) return { color: "#0284c7", rgb: "2,132,199", label: "相关" };
  return { color: "#0284c7", rgb: "2,132,199", label: "无关" };
}

const SCALE: { p: number; label: string }[] = [
  { p: 0, label: "无关" },
  { p: 35, label: "接近" },
  { p: 70, label: "逼近" },
  { p: 100, label: "命中" },
];

export default function SimilarityBar({ value }: Props) {
  const v = Math.max(0, Math.min(100, value));
  const tier = simTier(v);

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* 大数字 + 标签 */}
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="font-mono font-bold tabular-nums"
          style={{
            fontSize: "2.75rem",
            color: tier.color,
            lineHeight: 1,
          }}
        >
          {v <= 0 ? "0.00" : v.toFixed(2)}
          <span className="text-xl">%</span>
        </div>
        <div
          className="rounded-full border px-3 py-0.5 font-heading text-[10px] tracking-[0.3em]"
          style={{
            color: tier.color,
            borderColor: `rgba(${tier.rgb},0.3)`,
            background: `rgba(${tier.rgb},0.08)`,
          }}
        >
          {tier.label}
        </div>
      </div>

      {/* 频谱条主体 */}
      <div className="relative w-full px-1">
        {/* 轨道 */}
        <div className="relative h-3 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          {/* 全频谱渐变背景（低透明度示意） */}
          <div
            className="absolute inset-0 rounded-full opacity-25"
            style={{
              background:
                "linear-gradient(90deg, #0284c7 0%, #4f46e5 35%, #7c3aed 70%, #059669 100%)",
            }}
          />
          {/* 已填充部分（从 0 到当前值） */}
          {v > 0 && (
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${v}%`,
                background: `linear-gradient(90deg, #0284c7 0%, ${tier.color} 100%)`,
              }}
            />
          )}
        </div>

        {/* 指示器（当前值位置标记） */}
        {v > 0 && (
          <div
            className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white"
            style={{
              left: `${v}%`,
              borderColor: tier.color,
              boxShadow: `0 0 0 1px rgba(${tier.rgb},0.25)`,
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: tier.color }}
            />
          </div>
        )}
      </div>

      {/* 底部刻度 + 分级语义 */}
      <div className="relative w-full px-1">
        {/* 刻度线（对应 0/35/70/100） */}
        <div className="absolute inset-x-1 top-0 h-2">
          {SCALE.map((t) => (
            <div
              key={t.p}
              className="absolute top-0 h-1.5 w-px bg-slate-300"
              style={{ left: `${t.p}%` }}
            />
          ))}
        </div>
        {/* 标签 */}
        <div className="mt-3 flex justify-between">
          {SCALE.map((t) => (
            <div
              key={t.p}
              className="flex flex-col items-center gap-0.5"
              style={{
                transform:
                  t.p === 0
                    ? "translateX(0)"
                    : t.p === 100
                    ? "translateX(-100%)"
                    : "translateX(-50%)",
              }}
            >
              <span className="font-mono text-[9px] tabular-nums text-slate-400">
                {t.p}
              </span>
              <span className="font-heading text-[8px] tracking-wider text-slate-400">
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * GameCategories — 游戏分类（亮色蓝调版）
 * 4×2 网格，圆角图标卡片，点击 Ripple
 */
import { useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Car,
  Cpu,
  Crosshair,
  Joystick,
  Puzzle,
  Swords,
  Wand2,
  type LucideProps,
} from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { accentColorMap, categories } from "@/lib/data";
import { useRipple } from "@/hooks/useRipple";
import { cardReveal, listStagger, viewportOnce } from "@/lib/motion";

const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  Crosshair,
  Swords,
  Wand2,
  Cpu,
  Car,
  Brain,
  Puzzle,
  Joystick,
};

export default function GameCategories() {
  return (
    <section id="categories" className="relative z-10 py-24 md:py-32">
      <div className="container">
        <SectionHeading title="游戏分类" align="center" />

        <motion.div
          variants={listStagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4"
        >
          {categories.map((cat) => (
            <motion.div key={cat.id} variants={cardReveal}>
              <CategoryTile
                icon={ICON_MAP[cat.icon]}
                name={cat.name}
                count={cat.count}
                accentHex={accentColorMap[cat.accent].hex}
                accentRgb={accentColorMap[cat.accent].rgb}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

interface CategoryTileProps {
  icon: ComponentType<LucideProps>;
  name: string;
  count: number;
  accentHex: string;
  accentRgb: string;
}

function CategoryTile({
  icon: Icon,
  name,
  count,
  accentHex,
  accentRgb,
}: CategoryTileProps) {
  const { ripples, trigger } = useRipple();
  const [hover, setHover] = useState(false);

  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => trigger(e)}
      className="ripple-host group relative flex aspect-square flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-500 hover:border-slate-300 hover:bg-slate-50"
      style={
        hover
          ? {
              boxShadow: `0 16px 40px -16px rgba(${accentRgb},0.4), inset 0 0 0 1px rgba(${accentRgb},0.3)`,
              transform: "translateY(-6px)",
            }
          : undefined
      }
    >
      {/* Ripple */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-ink"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
            background: `radial-gradient(circle, rgba(${accentRgb},0.4) 0%, transparent 70%)`,
          }}
        />
      ))}

      {/* 背景大图标 */}
      <Icon
        className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 opacity-[0.06] transition-all duration-500 group-hover:opacity-[0.14]"
        style={{ color: accentHex, transform: hover ? "rotate(-12deg)" : undefined }}
        strokeWidth={1}
      />

      {/* 图标容器 */}
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-500"
        style={{
          borderColor: `rgba(${accentRgb},${hover ? 0.5 : 0.2})`,
          background: `linear-gradient(135deg, rgba(${accentRgb},0.15), rgba(${accentRgb},0.05))`,
          boxShadow: hover ? `0 8px 20px rgba(${accentRgb},0.3)` : "none",
        }}
      >
        <Icon
          className="h-7 w-7 transition-transform duration-500 group-hover:scale-110"
          style={{ color: accentHex }}
          strokeWidth={1.8}
        />
      </div>

      {/* 名称 + 数量 */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-display text-base font-bold tracking-wider text-slate-900">
          {name}
        </span>
        <span className="font-heading text-[10px] tracking-[0.2em] text-slate-500">
          {count} 款游戏
        </span>
      </div>

      {/* 底部光条 */}
      <div
        className="absolute inset-x-8 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{
          background: `linear-gradient(90deg, ${accentHex}, transparent)`,
        }}
      />
    </button>
  );
}

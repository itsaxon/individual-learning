/**
 * MagneticButton — 磁吸按钮 + Ripple（亮色蓝调版）
 * - 鼠标靠近时按钮被「拉」向鼠标
 * - 内部图标 / 文字反向偏移制造层次
 * - 点击触发 Ripple 水波纹（蓝色）
 */
import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRipple } from "@/hooks/useRipple";

interface MagneticButtonProps {
  children: ReactNode;
  variant?: "primary" | "glass" | "ghost";
  className?: string;
  onClick?: () => void;
  strength?: number;
}

export default function MagneticButton({
  children,
  variant = "primary",
  className = "",
  onClick,
  strength = 0.35,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const { ripples, trigger } = useRipple();
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 });

  function onMove(e: MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * strength);
    y.set(relY * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
    setHovered(false);
  }

  const base =
    variant === "primary"
      ? "btn-primary magnetic-host"
      : variant === "glass"
      ? "btn-glass magnetic-host"
      : "relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-colors";

  // 亮色版 hover 阴影（蓝色柔和）
  const glow =
    variant === "primary"
      ? hovered
        ? "drop-shadow(0 12px 24px rgba(37,99,235,0.45))"
        : "drop-shadow(0 8px 16px rgba(37,99,235,0.3))"
      : variant === "glass"
      ? hovered
        ? "drop-shadow(0 8px 20px rgba(59,130,246,0.25))"
        : "drop-shadow(0 4px 10px rgba(15,23,42,0.08))"
      : "";

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy, filter: glow }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={() => setHovered(true)}
      onClick={(e) => {
        trigger(e);
        onClick?.();
      }}
      whileTap={{ scale: 0.96 }}
      className={`ripple-host ${base} ${className}`}
    >
      {/* Ripple 水波纹（被 overflow:hidden 裁切） */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-ink"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
          }}
        />
      ))}
      {/* 内容层 */}
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}

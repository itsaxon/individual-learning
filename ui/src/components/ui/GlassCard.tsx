/**
 * GlassCard — 可复用玻璃卡片
 * - 玻璃 blur + 渐变边框
 * - 可选 accent 发光
 * - 可选 Tilt 3D（包裹 react-parallax-tilt）
 */
import { type ReactNode } from "react";
import Tilt from "react-parallax-tilt";
import { accentColorMap } from "@/lib/data";
import type { AccentColor } from "@/types";

interface GlassCardProps {
  children: ReactNode;
  accent?: AccentColor;
  tilt?: boolean;
  glow?: boolean;
  className?: string;
  tiltMax?: number;
  scale?: number;
}

export default function GlassCard({
  children,
  accent = "violet",
  tilt = false,
  glow = true,
  className = "",
  tiltMax = 8,
  scale = 1.02,
}: GlassCardProps) {
  const c = accentColorMap[accent];

  const inner = (
    <div
      className={`gradient-border relative overflow-hidden rounded-2xl glass ${className}`}
      style={
        glow
          ? {
              boxShadow: `0 20px 60px -20px rgba(${c.rgb},0.4), 0 0 0 1px rgba(${c.rgb},0.18)`,
            }
          : undefined
      }
    >
      {/* 顶部高光 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      {/* Hover 内辉光 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 hover:opacity-100"
        style={{
          background: `radial-gradient(circle at center, rgba(${c.rgb},0.18), transparent 60%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );

  if (!tilt) return inner;

  return (
    <Tilt
      tiltMaxAngleX={tiltMax}
      tiltMaxAngleY={tiltMax}
      scale={scale}
      transitionSpeed={1500}
      transitionEasing="cubic-bezier(0.22, 1, 0.36, 1)"
      glareEnable
      glareMaxOpacity={0.25}
      glareColor={`rgb(${c.rgb})`}
      glarePosition="all"
      style={{ transformStyle: "preserve-3d" }}
    >
      {inner}
    </Tilt>
  );
}

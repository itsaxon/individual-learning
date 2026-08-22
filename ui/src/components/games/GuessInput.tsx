/**
 * GuessInput — 核心输入交互
 *
 * - 大尺寸圆角输入框，聚焦时光环动画
 * - 回车提交；提交时按钮缩放 + 波纹 + 粒子爆炸
 * - 重复猜测 / 错误信息在输入框下方提示
 * - 胜利后禁用，显示「已猜中」
 */
import { forwardRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  submitting?: boolean;
  won?: boolean;
  error?: string;
}

interface Burst {
  id: number;
  x: number;
  y: number;
}

const PARTICLE_COUNT = 14;

const GuessInput = forwardRef<HTMLInputElement, Props>(function GuessInput(
  { value, onChange, onSubmit, disabled, submitting, won, error },
  ref,
) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [focused, setFocused] = useState(false);

  const triggerBurst = () => {
    const id = Date.now();
    setBursts((b) => [...b, { id, x: 50, y: 50 }]);
    setTimeout(() => {
      setBursts((b) => b.filter((x) => x.id !== id));
    }, 800);
  };

  const handleSubmit = () => {
    if (disabled || submitting || won) return;
    triggerBurst();
    onSubmit();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="relative">
        {/* 聚焦光环：径向辐射，中心亮、边缘自然消失，避免左右突兀色块 */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl blur-2xl"
          animate={{
            opacity: focused ? 1 : 0,
            background: focused
              ? "radial-gradient(ellipse at center, rgba(59,130,246,0.45) 0%, rgba(14,165,233,0.25) 45%, transparent 75%)"
              : "transparent",
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />

        <div className="relative flex items-stretch gap-1.5 rounded-2xl border border-slate-200 bg-white/85 p-1.5 backdrop-blur-md sm:gap-2">
          <div className="relative flex-1">
            {/* 粒子爆炸容器 */}
            <AnimatePresence>
              {bursts.map((b) => (
                <ParticleBurst key={b.id} x={b.x} y={b.y} />
              ))}
            </AnimatePresence>

            <input
              ref={ref}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              disabled={disabled || won}
              placeholder={won ? "已猜中！" : "输入一个中文词语，按回车提交…"}
              maxLength={10}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              // text-base (16px) 防 iOS 聚焦时自动放大；enterkeyhint 让手机键盘回车键显示"发送"
              enterKeyHint="send"
              className="w-full rounded-xl bg-transparent px-3 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 sm:px-4 sm:py-3.5 sm:text-lg"
            />
          </div>

          {/* 提交按钮：内容用固定尺寸 flex 容器，避免 svg/div 切换抖动 */}
          <motion.button
            onClick={handleSubmit}
            disabled={disabled || submitting || won}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.03 }}
            className="relative flex w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white shadow-lg sm:w-16 disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background:
                "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)",
              boxShadow: "0 8px 20px -6px rgba(37,99,235,0.5)",
            }}
          >
            <span className="flex h-5 w-5 items-center justify-center">
              {submitting ? (
                <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : won ? (
                <Sparkles className="h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </span>
          </motion.button>
        </div>
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/** 粒子爆炸：从中心向四周发散 */
function ParticleBurst({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
        const dist = 40 + Math.random() * 30;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const colors = ["#3b82f6", "#0ea5e9", "#8b5cf6", "#f59e0b"];
        const color = colors[i % colors.length];
        return (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{ background: color, left: 0, top: 0 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: dx,
              y: dy,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

export default GuessInput;

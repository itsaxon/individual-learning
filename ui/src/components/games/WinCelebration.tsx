/**
 * WinCelebration — 胜利庆祝弹窗
 *
 * 猜中时弹出：
 *   - 全屏粒子爆炸（彩色五彩纸屑从顶部洒落）
 *   - 中央卡片：奖杯 + 「恭喜答对」+ 答案 + 用时 + 猜测次数
 *   - 评价标签（根据猜测次数）
 *   - 操作按钮：查看记录 / 再来一局
 */
import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Home, RotateCcw, Target, Trophy, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  onRestart: () => void;
  answer: string;
  guessCount: number;
  durationMs: number;
  mode: string;
}

const CONFETTI_COUNT = 60;

function fmtDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default function WinCelebration({
  open,
  onClose,
  onRestart,
  answer,
  guessCount,
  durationMs,
  mode,
}: Props) {
  const navigate = useNavigate();
  // 五彩纸屑：只生成一次，跟随 open
  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, () => ({
        x: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.6 + Math.random() * 1.2,
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 8,
        color: [
          "#3b82f6",
          "#0ea5e9",
          "#8b5cf6",
          "#f59e0b",
          "#f97316",
          "#10b981",
          "#ec4899",
        ][Math.floor(Math.random() * 7)],
        drift: (Math.random() - 0.5) * 80,
      })),
    [],
  );

  // 锁定背景滚动
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const tier = (() => {
    if (guessCount <= 5) return { label: "神乎其技", color: "#8b5cf6" };
    if (guessCount <= 15) return { label: "思路清晰", color: "#3b82f6" };
    if (guessCount <= 30) return { label: "渐入佳境", color: "#0ea5e9" };
    return { label: "终于搞定", color: "#10b981" };
  })();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* 五彩纸屑 */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {confetti.map((c, i) => (
              <motion.div
                key={i}
                className="absolute top-0 rounded-sm"
                style={{
                  left: `${c.x}%`,
                  width: c.size,
                  height: c.size * 1.6,
                  background: c.color,
                }}
                initial={{ y: -40, rotate: 0, opacity: 1 }}
                animate={{
                  y: "110vh",
                  x: c.drift,
                  rotate: c.rotate + 360,
                  opacity: [1, 1, 0.8, 0],
                }}
                transition={{
                  duration: c.duration,
                  delay: c.delay,
                  ease: "easeIn",
                }}
              />
            ))}
          </div>

          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 卡片 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-2xl shadow-amber-500/20 backdrop-blur-2xl"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-blue-500 to-sky-500" />

            <button
              onClick={onClose}
              className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center gap-5 px-6 py-8 sm:px-8">
              {/* 奖杯 */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 12,
                }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/40"
              >
                <Trophy className="h-10 w-10 text-white" />
              </motion.div>

              <div className="flex flex-col items-center gap-1.5">
                <h2 className="font-display text-3xl font-black tracking-tight text-slate-900">
                  恭喜<span className="gradient-text-soft">答对了</span>
                </h2>
                <span
                  className="rounded-full border px-3 py-0.5 font-heading text-[10px] font-bold tracking-[0.25em]"
                  style={{
                    color: tier.color,
                    borderColor: `${tier.color}40`,
                    background: `${tier.color}14`,
                  }}
                >
                  {tier.label}
                </span>
              </div>

              {/* 答案 */}
              <div className="flex w-full flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 py-4">
                <span className="font-heading text-[10px] tracking-[0.25em] text-slate-500">
                  答案
                </span>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="font-display text-2xl font-black tracking-wider text-slate-900"
                >
                  {answer || "已揭晓"}
                </motion.span>
              </div>

              {/* 战绩 */}
              <div className="grid w-full grid-cols-2 gap-3">
                <div className="flex flex-col items-center gap-1 rounded-2xl border border-blue-200 bg-blue-50 py-4">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-heading text-[10px] tracking-[0.2em] text-slate-500">
                    用时
                  </span>
                  <span className="font-mono text-xl font-bold tabular-nums text-blue-700">
                    {fmtDuration(durationMs)}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-2xl border border-pink-200 bg-pink-50 py-4">
                  <Target className="h-4 w-4 text-pink-600" />
                  <span className="font-heading text-[10px] tracking-[0.2em] text-slate-500">
                    猜测次数
                  </span>
                  <span className="font-mono text-xl font-bold tabular-nums text-pink-700">
                    {guessCount}
                    <span className="text-sm text-pink-400"> 次</span>
                  </span>
                </div>
              </div>

              <div className="mt-2 flex w-full gap-3">
                <button
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  查看记录
                </button>
                <button
                  onClick={() => {
                    navigate("/");
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Home className="h-4 w-4" />
                  摸鱼舱
                </button>
                <button
                  onClick={onRestart}
                  className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-[1.02]"
                >
                  <RotateCcw className="h-4 w-4" />
                  {mode === "daily" ? "再来一局无限" : "再来一局"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

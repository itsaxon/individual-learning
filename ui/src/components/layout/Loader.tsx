/**
 * Loader — 进场加载动画（亮色蓝调版）
 *
 * 设计：
 *   - 亮色蓝调底，去掉了 WebGL/极光光团/暗角等深色特效
 *   - 极简：大号蓝色渐变品牌字 + 极细进度条 + 百分比
 *   - 完成后柔和淡出
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface LoaderProps {
  onComplete?: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let raf = 0;
    let exitTimer: number | undefined;
    const start = performance.now();
    const duration = 2200;
    function tick(now: number) {
      const k = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setProgress(Math.floor(eased * 100));
      if (k < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        exitTimer = window.setTimeout(() => {
          setDone(true);
          window.setTimeout(() => onCompleteRef.current?.(), 800);
        }, 400);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (exitTimer) window.clearTimeout(exitTimer);
    };
  }, []);

  const status =
    progress < 30
      ? "正在唤醒摸鱼空间"
      : progress < 70
      ? "正在召唤游戏伙伴"
      : progress < 100
      ? "马上就好，别急"
      : "准备就绪";

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0, filter: "blur(12px)", scale: 1.03 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden bg-[#eef4fb]"
        >
          {/* 极淡的蓝色光晕背景 */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(14,165,233,0.15), transparent 60%)",
            }}
          />

          {/* 中央内容 */}
          <div className="relative z-10 flex flex-col items-center gap-10 px-6">
            {/* 顶部装饰小点 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2"
            >
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-blue-600"
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="font-heading text-[10px] tracking-[0.4em] text-slate-500">
                MOYU SYSTEM
              </span>
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-sky-500"
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              />
            </motion.div>

            {/* 大号渐变品牌字 */}
            <motion.div
              initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-3"
            >
              <h1 className="font-display text-5xl font-black tracking-tight md:text-7xl">
                <span className="gradient-text">摸鱼舱</span>
              </h1>
              <span className="font-heading text-xs tracking-[0.5em] text-slate-500 md:text-sm">
                M O Y U · 打 工 人 游 戏 空 间
              </span>
            </motion.div>

            {/* 进度区 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-[min(80vw,360px)] flex-col gap-3"
            >
              <div className="flex items-end justify-between">
                <span className="font-heading text-xs tracking-[0.2em] text-slate-500">
                  {status}
                </span>
                <span className="font-display text-3xl font-bold tabular-nums text-slate-900 md:text-4xl">
                  {progress}
                  <span className="text-lg text-blue-600 md:text-xl">%</span>
                </span>
              </div>

              {/* 极细进度条 */}
              <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-slate-200">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%)",
                  }}
                />
                {/* 进度条前端光点 */}
                <motion.div
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-md"
                  style={{
                    left: `calc(${progress}% - 5px)`,
                    opacity: progress > 0 && progress < 100 ? 1 : 0,
                    boxShadow: "0 0 8px rgba(37,99,235,0.6)",
                  }}
                />
              </div>

              {/* 底部小提示 */}
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                <span className="font-heading tracking-[0.15em]">v1.0.0</span>
                <span className="font-heading tracking-[0.15em]">
                  请稍候 · 别让老板发现
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

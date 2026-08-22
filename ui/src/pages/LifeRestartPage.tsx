/**
 * 人生重开 — 第四个游戏入口
 *
 * 两个游戏：
 *  - 人生重开：LifeRestartGame（基于 lifeRestart 逻辑层，React 重写 UI，原生组件）
 *  - 文字修仙：通过 iframe 无缝嵌入 vue-xiuxiangame-main 的构建产物
 *    （静态资源位于 /external/xiuxian-game/，由 vue 项目 base: './' 相对路径构建，
 *     可在任意子路径下访问，无需修改资源引用）
 *
 * 主题：白色亮色（与词海寻踪/九宫寻数一致），金色作为强调色
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LifeRestartGame from "@/games/life-restart/LifeRestartGame";

type Mode = "life" | "xiuxian";

const MODES: { id: Mode; label: string }[] = [
  { id: "life", label: "人生重开" },
  { id: "xiuxian", label: "文字修仙" },
];

/** 标准中文字体栈 */
const CN_FONT =
  '"PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Hiragino Sans GB", "Source Han Sans SC", sans-serif';

/** 修仙游戏 iframe URL：基于 Vite base 路径拼接，确保 dev / prod 均可访问 */
const XIUXIAN_IFRAME_SRC = `${import.meta.env.BASE_URL}external/xiuxian-game/index.html`;

export default function LifeRestartPage() {
  const [mode, setMode] = useState<Mode>("life");
  const navigate = useNavigate();

  // 使用 react-router 的 navigate 而非直接修改 window.location.hash，
  // 避免在 iframe 嵌入场景下因 hash 路由同步问题导致返回失效
  const goHome = () => {
    navigate("/");
  };

  // 文字修仙：iframe 无缝嵌入，占满整个视口
  if (mode === "xiuxian") {
    return (
      <div
        className="fixed inset-0 z-40 bg-[#f5f5f5]"
        style={{ fontFamily: CN_FONT }}
      >
        {/* 顶部浮动导航条：返回摸鱼舱 + 切换到人生重开 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
          <button
            onClick={goHome}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] text-slate-600 shadow-sm backdrop-blur-md transition-colors hover:border-blue-300 hover:text-blue-600 sm:px-3.5 sm:py-2 sm:text-xs lg:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            摸鱼舱
          </button>
          <button
            onClick={() => setMode("life")}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50/90 px-3 py-1.5 text-[11px] font-medium text-blue-700 shadow-sm backdrop-blur-md transition-colors hover:bg-blue-100 sm:px-3.5 sm:py-2 sm:text-xs lg:text-sm"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            人生重开
          </button>
        </div>

        {/* iframe 无缝嵌入：占满视口，无边框，不显示滚动条（让游戏内部自己处理滚动） */}
        <iframe
          src={XIUXIAN_IFRAME_SRC}
          title="文字修仙"
          className="h-full w-full border-0"
          style={{ display: "block", minHeight: "100vh", background: "#f5f5f5" }}
          allow="fullscreen; autoplay; clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
        />
      </div>
    );
  }

  return (
    <>
      <LifeRestartBackground />
      <div
        className="relative flex min-h-screen flex-col px-3 pt-6 pb-4 text-slate-900 sm:px-6 sm:pt-12 sm:pb-6 lg:px-8"
        style={{ fontFamily: CN_FONT }}
      >
        {/* 顶部标题栏 */}
        <header className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 sm:gap-4">
          <div className="relative flex w-full items-center justify-center">
            <button
              onClick={goHome}
              className="absolute left-0 top-0 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] text-slate-600 backdrop-blur-md transition-colors hover:border-blue-300 hover:text-blue-600 sm:left-4 sm:top-0 sm:px-3.5 sm:py-2 sm:text-xs lg:left-6 lg:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              摸鱼舱
            </button>
            <motion.div
              initial={{ opacity: 0, y: -12, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-1 sm:gap-1.5"
            >
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                <span className="text-slate-900">人生</span>
                <span className="bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 bg-clip-text text-transparent">
                  重开
                </span>
              </h1>
              <p className="text-xs tracking-[0.3em] text-slate-500 sm:text-sm">
                一 念 之 间  重 来 一 生
              </p>
            </motion.div>
          </div>

          {/* Tab 切换 */}
          <div className="relative flex w-full max-w-lg items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur-md sm:max-w-xl">
            {MODES.map((m) => {
              const active = m.id === mode;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={
                    "relative flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-colors sm:text-base " +
                    (active
                      ? "text-blue-700"
                      : "text-slate-500 hover:text-slate-800")
                  }
                >
                  {active && (
                    <motion.span
                      layoutId="life-mode-pill"
                      className="absolute inset-0 rounded-xl border border-blue-300 bg-gradient-to-r from-blue-100 to-sky-100"
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    {active && <Sparkles className="h-4 w-4" />}
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {/* 游戏容器：原生 React 组件，接近占满屏幕 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-4 w-full max-w-6xl flex-1 sm:mt-5"
        >
          <div className="relative h-[calc(100vh-180px)] min-h-[560px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-lg shadow-slate-300/30 backdrop-blur-md sm:h-[calc(100vh-200px)]">
            <LifeRestartGame />
          </div>
        </motion.div>
      </div>
    </>
  );
}

/* ============ 亮色背景（与词海寻踪一致） ============ */

function LifeRestartBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 基底渐变：浅灰白 → 冷白 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
        }}
      />

      {/* 顶部蓝色渐变（淡） */}
      <div
        className="absolute inset-x-0 top-0 h-64 opacity-70"
        style={{
          background:
            "linear-gradient(180deg, rgba(59,130,246,0.08) 0%, transparent 100%)",
        }}
      />

      {/* 左上蓝色光晕（淡） */}
      <div
        className="absolute -left-40 -top-40 h-[44rem] w-[44rem] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 65%)",
          animation: "lr-float-a 18s ease-in-out infinite",
        }}
      />

      {/* 右上天蓝光晕（淡） */}
      <div
        className="absolute -right-48 -top-24 h-[36rem] w-[36rem] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(14,165,233,0.16) 0%, transparent 65%)",
          animation: "lr-float-b 22s ease-in-out infinite",
        }}
      />

      {/* 角落「命」「轮」字水印 */}
      <span
        className="absolute left-[6%] top-[16%] hidden select-none font-bold text-blue-500/[0.06] sm:block"
        style={{
          fontSize: "13rem",
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          animation: "lr-fade 9s ease-in-out infinite",
        }}
      >
        命
      </span>
      <span
        className="absolute right-[8%] top-[10%] hidden select-none font-bold text-sky-500/[0.05] sm:block"
        style={{
          fontSize: "10rem",
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          animation: "lr-fade 11s ease-in-out infinite 1s",
        }}
      >
        轮
      </span>

      <style>{`
        @keyframes lr-float-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 30px) scale(1.05); }
        }
        @keyframes lr-float-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -40px) scale(1.08); }
        }
        @keyframes lr-fade {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.10; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pointer-events-none.fixed > div,
          .pointer-events-none.fixed > span {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

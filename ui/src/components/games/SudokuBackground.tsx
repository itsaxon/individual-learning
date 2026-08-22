/**
 * SudokuBackground — 九宫寻数专属背景
 *
 * 主题：灵感来自数独的网格 + 数学几何美感
 * 元素：
 *   - 浅色基底渐变（与网站整体亮色主题一致）
 *   - 9×9 淡淡的网格图案（呼应数独棋盘）
 *   - 几个柔和的蓝/青/紫光晕（缓慢漂浮）
 *   - 角落的数字水印（1-9 极淡显示，呼应数字主题）
 *   - 顶部一条蓝色光带
 */
export default function SudokuBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 基底渐变：从浅蓝到极浅青 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #eaf2fb 0%, #e8f1fa 40%, #f0f5fa 100%)",
        }}
      />

      {/* 9×9 网格图案（呼应数独棋盘） */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "calc(100% / 9) calc(100% / 9)",
        }}
      />

      {/* 3×3 宫粗线（每隔 3 格加深） */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15,23,42,0.12) 1.5px, transparent 1.5px),
            linear-gradient(90deg, rgba(15,23,42,0.12) 1.5px, transparent 1.5px)
          `,
          backgroundSize: "calc(100% / 3) calc(100% / 3)",
        }}
      />

      {/* 左上蓝色光晕（缓慢漂浮） */}
      <div
        className="absolute -left-40 -top-40 h-[44rem] w-[44rem] rounded-full opacity-45 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.28) 0%, transparent 65%)",
          animation: "sudoku-float-a 14s ease-in-out infinite",
        }}
      />

      {/* 右下青色光晕（反向漂浮） */}
      <div
        className="absolute -right-48 bottom-0 h-[42rem] w-[42rem] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(14,165,233,0.24) 0%, transparent 65%)",
          animation: "sudoku-float-b 18s ease-in-out infinite",
        }}
      />

      {/* 中部紫色光晕（极淡，增加层次） */}
      <div
        className="absolute left-1/2 top-1/3 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
          animation: "sudoku-float-c 16s ease-in-out infinite",
        }}
      />

      {/* 顶部蓝色光带 */}
      <div
        className="absolute inset-x-0 top-0 h-32 opacity-50"
        style={{
          background:
            "linear-gradient(180deg, rgba(59,130,246,0.15) 0%, transparent 100%)",
        }}
      />

      {/* 角落数字水印（呼应数独数字主题，移动端隐藏避免干扰） */}
      <span
        className="absolute left-[6%] top-[18%] hidden font-bold text-slate-300/40 select-none sm:block"
        style={{
          fontSize: "12rem",
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          animation: "sudoku-fade 8s ease-in-out infinite",
        }}
      >
        9
      </span>
      <span
        className="absolute right-[8%] top-[12%] hidden font-bold text-slate-300/35 select-none sm:block"
        style={{
          fontSize: "9rem",
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          animation: "sudoku-fade 10s ease-in-out infinite 1s",
        }}
      >
        3
      </span>
      <span
        className="absolute left-[10%] bottom-[8%] hidden font-bold text-slate-300/30 select-none sm:block"
        style={{
          fontSize: "10rem",
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          animation: "sudoku-fade 9s ease-in-out infinite 2s",
        }}
      >
        6
      </span>
      <span
        className="absolute right-[6%] bottom-[14%] hidden font-bold text-slate-300/35 select-none sm:block"
        style={{
          fontSize: "11rem",
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          animation: "sudoku-fade 11s ease-in-out infinite 0.5s",
        }}
      >
        1
      </span>

      {/* 注入 keyframes */}
      <style>{`
        @keyframes sudoku-float-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 30px) scale(1.05); }
        }
        @keyframes sudoku-float-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -40px) scale(1.08); }
        }
        @keyframes sudoku-float-c {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, 30px) scale(1.06); }
        }
        @keyframes sudoku-fade {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.55; }
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

/**
 * ImpostorBackground — 找出冒牌货专属背景（亮色简约主题）
 *
 * 与词海寻踪/九宫寻数保持统一的亮色风格，
 * 使用紫色作为强调色（呼应「推理 / 神秘」氛围）
 */
export default function ImpostorBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 基底渐变：浅紫白 → 冷白 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #f8f7fc 0%, #f1f0fa 50%, #e8e6f5 100%)",
        }}
      />

      {/* 顶部紫色渐变（淡） */}
      <div
        className="absolute inset-x-0 top-0 h-64 opacity-70"
        style={{
          background:
            "linear-gradient(180deg, rgba(139,92,246,0.10) 0%, transparent 100%)",
        }}
      />

      {/* 左上紫色光晕（淡） */}
      <div
        className="absolute -left-40 -top-40 h-[44rem] w-[44rem] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.20) 0%, transparent 65%)",
        }}
      />

      {/* 右下品红光晕（淡） */}
      <div
        className="absolute -right-48 bottom-0 h-[42rem] w-[42rem] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(217,70,239,0.16) 0%, transparent 65%)",
        }}
      />

      {/* 角落「疑」字水印 */}
      <span
        className="absolute left-[6%] top-[16%] hidden select-none font-bold text-violet-500/[0.06] sm:block"
        style={{
          fontSize: "13rem",
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        疑
      </span>
      <span
        className="absolute right-[8%] top-[10%] hidden select-none font-bold text-fuchsia-500/[0.05] sm:block"
        style={{
          fontSize: "10rem",
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        寻
      </span>
    </div>
  );
}

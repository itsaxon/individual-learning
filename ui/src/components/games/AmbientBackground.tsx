/**
 * AmbientBackground — 游戏页氛围背景（静态版）
 *
 * 纯静态浅蓝渐变背景 + 两个固定的柔和光晕，
 * 无动画、无粒子，保持平静沉浸感。
 */
export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 基底渐变 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #eef4fb 0%, #e7f0fb 50%, #eaf2fc 100%)",
        }}
      />
      {/* 固定光晕（无动画） */}
      <div
        className="absolute -left-32 -top-32 h-[42rem] w-[42rem] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute -right-40 top-1/4 h-[38rem] w-[38rem] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 65%)",
        }}
      />
    </div>
  );
}

/**
 * AuroraGlow — 流动极光光晕
 * 三团大型径向光斑，使用 CSS aurora-flow 缓慢漂移
 */
export default function AuroraGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {/* 紫罗兰光团 - 左上 */}
      <div
        className="absolute -left-[20%] -top-[10%] h-[60vh] w-[60vh] rounded-full opacity-60 blur-3xl animate-aurora-flow"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.55) 0%, rgba(124,58,237,0.18) 40%, transparent 70%)",
          animationDelay: "0s",
        }}
      />
      {/* 青蓝光团 - 右下 */}
      <div
        className="absolute -right-[15%] top-[40%] h-[55vh] w-[55vh] rounded-full opacity-50 blur-3xl animate-aurora-flow"
        style={{
          background:
            "radial-gradient(circle, rgba(0,229,255,0.45) 0%, rgba(0,229,255,0.15) 40%, transparent 70%)",
          animationDelay: "-4s",
          animationDirection: "reverse",
        }}
      />
      {/* 品红光团 - 中央偏下 */}
      <div
        className="absolute left-[30%] top-[60%] h-[50vh] w-[50vh] rounded-full opacity-40 blur-3xl animate-aurora-flow"
        style={{
          background:
            "radial-gradient(circle, rgba(255,45,149,0.4) 0%, rgba(255,45,149,0.12) 40%, transparent 70%)",
          animationDelay: "-8s",
        }}
      />
      {/* 薄荷绿小光斑 - 散点 */}
      <div
        className="absolute left-[60%] top-[15%] h-[28vh] w-[28vh] rounded-full opacity-25 blur-3xl animate-aurora-flow"
        style={{
          background:
            "radial-gradient(circle, rgba(0,255,178,0.35) 0%, transparent 70%)",
          animationDelay: "-2s",
          animationDirection: "reverse",
        }}
      />
    </div>
  );
}

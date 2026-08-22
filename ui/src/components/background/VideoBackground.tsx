/**
 * VideoBackground — 电影级动态背景（兜底方案）
 *
 * 当 WebGL Scene 未启用时（低端设备），渲染此 Canvas 场景作为可靠背景。
 * 当 WebGL 启用时，可设置 active=false 节省性能（仅保留遮罩层）。
 */
import { useEffect, useRef, useState } from "react";

interface VideoBackgroundProps {
  /** 是否启用 Canvas 绘制（默认 true） */
  active?: boolean;
}

interface Building {
  x: number;
  w: number;
  h: number;
  hue: number;
  windowSeed: number;
}

export default function VideoBackground({ active = true }: VideoBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let buildings: Building[] = [];
    let streaks: { x: number; y: number; speed: number; len: number; color: string }[] = [];
    let rafId = 0;
    let t = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildScene();
    }

    function buildScene() {
      // 远景城市天际线（两层）
      const count = Math.ceil(w / 70) + 4;
      buildings = Array.from({ length: count }, (_, i) => ({
        x: i * 70 - 40,
        w: 40 + Math.random() * 50,
        h: 80 + Math.random() * 220,
        hue: Math.random(),
        windowSeed: Math.random(),
      }));
      // 光带（飞车 / 飞行轨迹）
      streaks = Array.from({ length: 18 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.55,
        speed: 0.4 + Math.random() * 1.6,
        len: 60 + Math.random() * 220,
        color: ["255,45,149", "0,229,255", "124,58,237", "0,255,178"][
          Math.floor(Math.random() * 4)
        ],
      }));
    }

    function draw() {
      t += 0.005;
      // 清屏（透明，让下层渐变透出来）
      ctx.clearRect(0, 0, w, h);

      const horizon = h * 0.62;

      // ============ 远景天 ============
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
      skyGrad.addColorStop(0, "rgba(5,7,13,0)");
      skyGrad.addColorStop(0.6, "rgba(20,8,40,0.35)");
      skyGrad.addColorStop(1, "rgba(40,10,60,0.5)");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizon);

      // ============ 远景星点 ============
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      for (let i = 0; i < 60; i++) {
        const sx = (i * 137 + t * 4) % w;
        const sy = (i * 71) % (horizon * 0.5);
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i));
        ctx.globalAlpha = tw * 0.5;
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;

      // ============ 月亮 / 圆盘 ============
      const moonX = w * 0.78;
      const moonY = h * 0.22;
      const moonR = Math.min(w, h) * 0.06;
      const moonGrad = ctx.createRadialGradient(
        moonX,
        moonY,
        0,
        moonX,
        moonY,
        moonR * 4,
      );
      moonGrad.addColorStop(0, "rgba(255,100,180,0.55)");
      moonGrad.addColorStop(0.3, "rgba(124,58,237,0.25)");
      moonGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,200,220,0.85)";
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // ============ 远景城市天际线 ============
      for (const b of buildings) {
        const y = horizon - b.h * 0.55;
        // 建筑剪影
        ctx.fillStyle = "rgba(10,8,22,0.92)";
        ctx.fillRect(b.x, y, b.w, horizon - y);
        // 顶部霓虹边
        const neonColor =
          b.hue < 0.33
            ? "rgba(255,45,149,0.7)"
            : b.hue < 0.66
            ? "rgba(0,229,255,0.7)"
            : "rgba(124,58,237,0.7)";
        ctx.fillStyle = neonColor;
        ctx.fillRect(b.x, y, b.w, 1.5);
        // 窗户点
        const cols = Math.floor(b.w / 7);
        const rows = Math.floor(b.h * 0.55 / 9);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const seed = (b.windowSeed * 99 + r * 13 + c * 7) % 1;
            if (seed > 0.78) {
              const flicker = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + r + c));
              ctx.fillStyle = `rgba(${b.hue < 0.5 ? "0,229,255" : "255,200,100"},${flicker * 0.7})`;
              ctx.fillRect(b.x + 3 + c * 7, y + 6 + r * 9, 2.4, 2.4);
            }
          }
        }
      }

      // ============ 透视网格地平面 ============
      ctx.strokeStyle = "rgba(124,58,237,0.18)";
      ctx.lineWidth = 1;
      // 横线（透视收缩）
      const gridLines = 16;
      for (let i = 0; i < gridLines; i++) {
        const k = i / gridLines;
        const y = horizon + (h - horizon) * Math.pow(k, 1.5);
        const alpha = 0.05 + k * 0.25;
        ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // 纵线（汇聚到消失点）
      const vanishX = w / 2;
      const vanishY = horizon;
      const colCount = 24;
      for (let i = 0; i <= colCount; i++) {
        const k = i / colCount;
        const xBottom = k * w * 2 - w * 0.5;
        ctx.strokeStyle = `rgba(124,58,237,${0.08 + Math.abs(k - 0.5) * 0.1})`;
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(xBottom, h);
        ctx.stroke();
      }

      // ============ 光带（飞车轨迹） ============
      for (const s of streaks) {
        s.x += s.speed;
        if (s.x > w + s.len) {
          s.x = -s.len;
          s.y = Math.random() * h * 0.55;
        }
        const grad = ctx.createLinearGradient(s.x - s.len, s.y, s.x, s.y);
        grad.addColorStop(0, `rgba(${s.color},0)`);
        grad.addColorStop(0.6, `rgba(${s.color},0.7)`);
        grad.addColorStop(1, `rgba(${s.color},0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x - s.len, s.y);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        // 头部光点
        ctx.fillStyle = `rgba(${s.color},0.9)`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // ============ 顶部柔光 ============
      const topGlow = ctx.createRadialGradient(
        w * 0.5,
        -50,
        0,
        w * 0.5,
        -50,
        h * 0.7,
      );
      topGlow.addColorStop(0, "rgba(124,58,237,0.18)");
      topGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, w, h * 0.7);

      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return (
    <div aria-hidden="true" className="fixed inset-0 z-0 overflow-hidden">
      {/* 主 Canvas 场景（WebGL 关闭时作为可靠的"视频"层） */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          active ? "opacity-70" : "opacity-0"
        }`}
        style={{ filter: "blur(0.5px)" }}
      />

      {/* 真实视频叠加层（如可用）：尝试 /bg.mp4 或公共 CDN */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setVideoReady(true)}
        onError={() => setVideoReady(false)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
          videoReady ? "opacity-40" : "opacity-0"
        }`}
        style={{ filter: "blur(2px) saturate(140%)" }}
      >
        <source src={`${import.meta.env.BASE_URL}bg.mp4`} type="video/mp4" />
      </video>

      {/* 暗色遮罩 */}
      <div className="absolute inset-0 bg-ink/70" />
      {/* 渐变蒙版（上下） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,7,13,0.85) 0%, rgba(5,7,13,0.4) 30%, rgba(5,7,13,0.6) 70%, rgba(5,7,13,0.95) 100%)",
        }}
      />
      {/* 品红左下点光 */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 10% 90%, rgba(255,45,149,0.18), transparent 40%)",
        }}
      />
      {/* Vignette 暗角 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(5,7,13,0.85) 100%)",
        }}
      />
      {/* 噪点 */}
      <div className="noise-overlay absolute inset-0" />
      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 3px)",
        }}
      />
    </div>
  );
}

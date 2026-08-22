/**
 * ParticleField — Canvas 2D 粒子背景
 * - 三层视差粒子（深度 / 速度 / 不透明度）
 * - 鼠标视差（相机微移）
 * - 粒子间连线（淡）
 * - 桌面 60 / 移动 30
 */
import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number; // 0.2 ~ 1 深度
  vx: number;
  vy: number;
  r: number;
  color: string;
  alpha: number;
}

const COLORS = [
  "124,58,237", // violet
  "0,229,255", // cyan
  "255,45,149", // pink
  "0,255,178", // mint
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let rafId = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function initParticles() {
      const count = isMobile ? 32 : 70;
      particles = Array.from({ length: count }, () => {
        const z = rand(0.2, 1);
        return {
          x: rand(0, width),
          y: rand(0, height),
          z,
          vx: rand(-0.15, 0.15) * z,
          vy: rand(-0.25, -0.05) * z, // 向上漂浮
          r: rand(0.6, 2.4) * z,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: rand(0.2, 0.9) * z,
        };
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      // 鼠标平滑跟随
      mouse.current.x += (mouse.current.tx - mouse.current.x) * 0.06;
      mouse.current.y += (mouse.current.ty - mouse.current.y) * 0.06;
      const offsetX = (mouse.current.x - width / 2) * 0.012;
      const offsetY = (mouse.current.y - height / 2) * 0.012;

      // 更新
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = rand(0, width);
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
      }

      // 连线（仅近邻，淡）
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 14400) {
            const opacity = (1 - dist2 / 14400) * 0.12 * Math.min(a.z, b.z);
            ctx.strokeStyle = `rgba(124,58,237,${opacity})`;
            ctx.beginPath();
            ctx.moveTo(a.x + offsetX * a.z, a.y + offsetY * a.z);
            ctx.lineTo(b.x + offsetX * b.z, b.y + offsetY * b.z);
            ctx.stroke();
          }
        }
      }

      // 粒子
      for (const p of particles) {
        const px = p.x + offsetX * p.z;
        const py = p.y + offsetY * p.z;
        // 外发光
        const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r * 4);
        grad.addColorStop(0, `rgba(${p.color},${p.alpha})`);
        grad.addColorStop(0.4, `rgba(${p.color},${p.alpha * 0.4})`);
        grad.addColorStop(1, `rgba(${p.color},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
        // 核心
        ctx.fillStyle = `rgba(${p.color},${Math.min(1, p.alpha + 0.2)})`;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    }

    function onMouse(e: MouseEvent) {
      mouse.current.tx = e.clientX;
      mouse.current.ty = e.clientY;
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[2]"
    />
  );
}

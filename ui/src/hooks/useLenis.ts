/**
 * useLenis — 平滑滚动初始化
 * 桌面启用，移动端关闭
 * 把 lenis 实例挂到 window 上，供 ScrollToTop 等组件调用
 * （lenis 包自带的 window.lenis 类型不含 scrollTo，用独立字段避免冲突）
 */
import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    __lenisInstance?: Lenis;
  }
}

export function useLenis() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });
    window.__lenisInstance = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete window.__lenisInstance;
    };
  }, []);
}

/**
 * ScrollToTop — 路由变化时滚到顶部
 * 兼容 Lenis：优先调用 lenis.scrollTo，否则原生 window.scrollTo
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (window.__lenisInstance) {
      window.__lenisInstance.scrollTo(0, { immediate: true });
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

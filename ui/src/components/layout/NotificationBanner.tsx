/**
 * NotificationBanner — 首次进入网站的横幅通知
 *
 * 首次访问时从右上角滑入，推荐「找出冒牌货」游戏。
 * 关闭后持久化到 localStorage，下次不再自动弹出。
 * 与 NotificationBell 共用 dismiss key，互不重复打扰。
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Users, X } from "lucide-react";

const BANNER_DISMISS_KEY = "moyu-notif-banner-dismissed";
const BANNER_AUTO_HIDE_MS = 12000; // 12 秒后自动收起

export default function NotificationBanner() {
  const [show, setShow] = useState(false);

  // 首次访问检测：localStorage 未标记已关闭则显示
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(BANNER_DISMISS_KEY);
      if (dismissed === "1") return;
    } catch {
      /* ignore */
    }
    // 延迟 2.2 秒后弹出，等首页 Loader 完成再展示
    const showTimer = window.setTimeout(() => setShow(true), 2200);
    return () => window.clearTimeout(showTimer);
  }, []);

  // 自动收起
  useEffect(() => {
    if (!show) return;
    const hideTimer = window.setTimeout(() => setShow(false), BANNER_AUTO_HIDE_MS);
    return () => window.clearTimeout(hideTimer);
  }, [show]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(BANNER_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 80, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 80, y: -20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed right-4 top-20 z-[180] w-[340px] max-w-[calc(100vw-2rem)] sm:right-6 sm:top-24"
        >
          <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-white/95 shadow-2xl shadow-violet-500/15 backdrop-blur-2xl">
            {/* 顶部彩色装饰条 */}
            <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />

            {/* 关闭按钮 */}
            <button
              onClick={dismiss}
              className="absolute right-2.5 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="关闭通知"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex gap-3 p-4 pr-10">
              {/* 图标 */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>

              {/* 内容 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700">
                    NEW
                  </span>
                  <p className="font-display text-sm font-bold text-slate-900">
                    找出冒牌货上线啦
                  </p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  3-12 人实时联机社交推理，谁是潜伏的冒牌货？超好玩，快叫上同事一起开局！
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href="#/games/zhaochu-maopaihuo"
                    onClick={dismiss}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-500/30 transition-transform hover:scale-105"
                  >
                    <Users className="h-3 w-3" />
                    立即开玩
                  </a>
                  <button
                    onClick={dismiss}
                    className="text-[11px] text-slate-400 transition-colors hover:text-slate-600"
                  >
                    以后再说
                  </button>
                </div>
              </div>
            </div>

            {/* 底部进度条（自动收起提示） */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: BANNER_AUTO_HIDE_MS / 1000, ease: "linear" }}
              className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-gradient-to-r from-violet-500 to-fuchsia-500"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

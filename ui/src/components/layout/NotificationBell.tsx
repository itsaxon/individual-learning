/**
 * NotificationBell — 右上角通知铃铛 + 弹出通知
 *
 * 推荐找出冒牌货游戏，用户可关闭。
 * 关闭状态持久化到 localStorage，下次不再打扰。
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Users, X } from "lucide-react";

const DISMISS_KEY = "moyu-notif-impostor-dismissed";

interface NotifItem {
  id: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  accent: string;
}

const NOTIFS: NotifItem[] = [
  {
    id: "impostor-online",
    title: "新游戏上线 · 找出冒牌货",
    body: "3-12 人实时联机社交推理，谁是潜伏的冒牌货？超好玩，快叫上同事一起开局！",
    cta: "立即开玩",
    href: "#/games/zhaochu-maopaihuo",
    accent: "#8b5cf6",
  },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [hasNew, setHasNew] = useState(false);

  // 初始化：从 localStorage 读取已关闭的通知
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      setDismissed(arr);
      // 是否有未关闭的通知
      setHasNew(NOTIFS.some((n) => !arr.includes(n.id)));
    } catch {
      setHasNew(true);
    }
  }, []);

  const dismiss = (id: string) => {
    const next = [...new Set([...dismissed, id])];
    setDismissed(next);
    setHasNew(NOTIFS.some((n) => !next.includes(n.id)));
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const visibleNotifs = NOTIFS.filter((n) => !dismissed.includes(n.id));

  return (
    <div className="relative">
      {/* 铃铛按钮 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600"
        aria-label="通知"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
        {hasNew && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
        )}
      </button>

      {/* 弹出通知面板 */}
      <AnimatePresence>
        {open && (
          <>
            {/* 点击外部关闭 */}
            <div
              className="fixed inset-0 z-[150]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-11 z-[160] w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-2xl"
            >
              {/* 顶部标题栏 */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span className="font-display text-sm font-bold text-slate-900">
                    通知
                  </span>
                  {hasNew && (
                    <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-600">
                      NEW
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="关闭"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 通知列表 */}
              <div className="max-h-[60vh] overflow-y-auto">
                {visibleNotifs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                    <Bell className="h-8 w-8 text-slate-300" />
                    <p className="text-xs text-slate-500">暂无新通知</p>
                  </div>
                ) : (
                  visibleNotifs.map((n) => {
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group relative border-b border-slate-100 px-4 py-4 transition-colors hover:bg-slate-50 last:border-b-0"
                      >
                        {/* 内容（已删除左侧星星图标） */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-display text-sm font-bold text-slate-900">
                              {n.title}
                            </p>
                            <button
                              onClick={() => dismiss(n.id)}
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-200 hover:text-slate-600"
                              aria-label="忽略此通知"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            {n.body}
                          </p>
                          <div className="mt-3 flex items-center gap-3">
                            <a
                              href={n.href}
                              onClick={() => setOpen(false)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105"
                              style={{
                                background: `linear-gradient(135deg, ${n.accent}, ${n.accent}cc)`,
                                boxShadow: `0 4px 12px -4px ${n.accent}80`,
                              }}
                            >
                              <Users className="h-3 w-3" />
                              {n.cta}
                            </a>
                            <button
                              onClick={() => dismiss(n.id)}
                              className="text-[11px] text-slate-400 transition-colors hover:text-slate-600"
                            >
                              忽略
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

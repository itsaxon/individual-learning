/**
 * Navbar — 顶部导航（亮色蓝调版）
 * - fixed top + 白色玻璃
 * - 滚动时收缩 + 加深背景
 * - Logo + 导航链接（蓝色下划线）
 * - 搜索图标 + 登录按钮
 * - 移动端汉堡菜单
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, User, X } from "lucide-react";
import MagneticButton from "@/components/ui/MagneticButton";
import NotificationBell from "./NotificationBell";
import SearchModal from "./SearchModal";

const NAV_ITEMS = [
  { label: "首页", href: "#hero" },
  { label: "玩游戏", href: "#/games" },
  { label: "看小说", href: "#/novels" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl + K 打开搜索
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-[100] transition-all duration-500 ${
        scrolled
          ? "border-b border-slate-200 bg-white/80 backdrop-blur-2xl shadow-sm shadow-blue-500/5"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="container flex h-[72px] items-center justify-between md:h-[68px]">
        {/* Logo */}
        <a href="#hero" className="group flex items-center gap-2.5">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt="摸鱼舱"
            className="h-9 w-9 rounded-xl transition-transform duration-300 group-hover:scale-110"
          />
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-bold tracking-wider text-slate-900">
              摸鱼<span className="gradient-text-soft">舱</span>
            </span>
            <span className="hidden font-heading text-[9px] tracking-[0.3em] text-slate-400 sm:block">
              MOYU · 打工人游戏空间
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
            >
              {item.label}
              <span className="absolute inset-x-3 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-blue-600 to-sky-500 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600 lg:flex"
            aria-label="搜索"
            title="搜索游戏或小说 (Ctrl+K)"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>

          {/* 移动端搜索按钮 */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/60 text-slate-600 transition-all hover:border-blue-300 hover:text-blue-600 lg:hidden"
            aria-label="搜索"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>

          {/* 通知铃铛 */}
          <NotificationBell />

          <div className="hidden md:block">
            <MagneticButton variant="glass" className="!px-4 !py-2 !text-sm">
              <User className="h-4 w-4" />
              <span>登录</span>
            </MagneticButton>
          </div>

          {/* 移动端登录按钮（仅图标） */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/60 text-slate-600 transition-all hover:border-blue-300 hover:text-blue-600 md:hidden"
            aria-label="登录"
          >
            <User className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>

          {/* Mobile menu toggle */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="菜单"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] md:hidden"
          >
            <div
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="absolute right-0 top-0 h-full w-[78%] max-w-[340px] border-l border-slate-200 bg-white/95 p-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold tracking-wider gradient-text">
                  菜单
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
                  aria-label="关闭"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-8 flex flex-col gap-1">
                {NAV_ITEMS.map((item, i) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-center justify-between border-b border-slate-200 py-4 text-xl font-display font-bold text-slate-900 hover:text-blue-600"
                  >
                    {item.label}
                    <span className="font-heading text-xs text-slate-400">
                      0{i + 1}
                    </span>
                  </motion.a>
                ))}
              </nav>
              <MagneticButton variant="primary" className="mt-8 w-full">
                <User className="h-4 w-4" />
                立即登录
              </MagneticButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 全局搜索弹窗 */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </motion.header>
  );
}

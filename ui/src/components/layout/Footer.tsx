/**
 * Footer — 页脚（亮色蓝调版）
 * - 4 栏：Brand / Platform / Community / Connect
 * - 顶分割线 + 社交图标 hover
 * - 底部版权栏
 */
import { motion } from "framer-motion";
import { Globe, Send } from "lucide-react";
import { viewportOnce } from "@/lib/motion";
import {
  BilibiliIcon,
  DouyinIcon,
  ThreadIcon,
  XIcon,
  XiaohongshuIcon,
} from "@/components/icons/SocialIcons";

const COLS = [
  {
    title: "平台",
    links: ["浏览游戏", "分类导航", "排行榜", "最新上架", "热门趋势"],
  },
  {
    title: "关于",
    links: ["关于我们", "加入我们", "媒体素材", "品牌资源", "联系我们"],
  },
  {
    title: "帮助",
    links: ["帮助中心", "系统状态", "退款政策", "开发者", "API 文档"],
  },
];

const SOCIALS = [
  { icon: DouyinIcon, label: "抖音", color: "#db2777" },
  { icon: XiaohongshuIcon, label: "小红书", color: "#db2777" },
  { icon: BilibiliIcon, label: "Bilibili", color: "#0284c7" },
  { icon: XIcon, label: "X", color: "#0f172a" },
  { icon: ThreadIcon, label: "Thread", color: "#6d28d9" },
];

export default function Footer() {
  return (
    <footer className="relative z-10 mt-32 overflow-hidden">
      {/* 顶分割线 */}
      <div className="relative h-px w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      </div>

      <div className="container relative z-10 py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]"
        >
          {/* Brand column */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            className="flex flex-col gap-5"
          >
            <a href="#hero" className="flex items-center gap-2.5">
              <img
                src={`${import.meta.env.BASE_URL}favicon.svg`}
                alt="摸鱼舱"
                className="h-10 w-10 rounded-xl transition-transform duration-300 hover:scale-110"
              />
              <div className="flex flex-col leading-none">
                <span className="font-display text-lg font-bold tracking-wider text-slate-900">
                  摸鱼<span className="gradient-text-soft">舱</span>
                </span>
                <span className="font-heading text-[10px] tracking-[0.3em] text-slate-400">
                  MOYU · 打工人游戏空间
                </span>
              </div>
            </a>
            <p className="max-w-sm text-sm leading-relaxed text-slate-600">
              打工人专属网页游戏平台。无需下载，浏览器即开即玩，
              老板永远发现不了你的快乐。
            </p>
            {/* Subscribe */}
            <div className="mt-2 flex max-w-sm items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pl-4">
              <input
                type="email"
                placeholder="your@email.com"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white transition-transform hover:scale-105">
                <Send className="h-4 w-4" />
              </button>
            </div>
            {/* Socials */}
            <div className="mt-2 flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-1 hover:border-slate-300"
                  style={
                    { "--hover-color": s.color } as React.CSSProperties
                  }
                >
                  <s.icon className="h-[18px] w-[18px] transition-colors group-hover:text-slate-900" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          {COLS.map((col) => (
            <motion.div
              key={col.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
              className="flex flex-col gap-4"
            >
              <h4 className="font-heading text-xs font-bold tracking-[0.2em] text-slate-500">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="group inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                    >
                      <span className="h-px w-0 bg-blue-600 transition-all duration-300 group-hover:w-4" />
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row">
          <p className="font-heading text-xs tracking-[0.15em] text-slate-500">
            © 2026 摸鱼舱 MOYU · 为打工人而生的游戏空间
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-xs text-slate-500 transition-colors hover:text-slate-900"
            >
              隐私
            </a>
            <a
              href="#"
              className="text-xs text-slate-500 transition-colors hover:text-slate-900"
            >
              条款
            </a>
            <a
              href="#"
              className="text-xs text-slate-500 transition-colors hover:text-slate-900"
            >
              Cookie
            </a>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Globe className="h-3.5 w-3.5" />
              <span>EN / 中</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

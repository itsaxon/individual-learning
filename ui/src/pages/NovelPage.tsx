/**
 * 小说阅读页 — 本地 epub 渲染器
 *
 * 视图：
 *   1. 书架视图：4 本本地 epub 卡片
 *   2. 阅读视图：epub.js 在 iframe 中渲染当前书
 *      - 上一页 / 下一页（按钮 + 键盘左右键）
 *      - 目录抽屉（章节跳转）
 *      - 阅读进度持久化（cfi）
 *      - 加载/错误态
 *
 * 性能：
 *   - epub 文件 fetch 一次性下载到 ArrayBuffer
 *   - Book 实例组件卸载时 destroy()，避免内存泄漏
 *   - 翻页用 rendition.next()/prev()，异步等待，不阻塞 UI
 *   - 容器固定高度 + overflow hidden，避免 iframe 撑高导致卡顿
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Library,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
// epub.js 自带 TS 类型
import ePub, { type Book, type Rendition } from "epubjs";
import {
  getProgress,
  LOCAL_NOVELS,
  saveProgress,
  setLastReadNovelId,
  type LocalNovelMeta,
} from "@/lib/classicNovels";

/** 章节目录项（扁平化后的 toc） */
interface TocItem {
  label: string;
  href: string;
}

export default function NovelPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<LocalNovelMeta | null>(null);

  return (
    <div className="relative min-h-screen pb-20">
      {/* 背景：暖色调光晕，营造书卷气 */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-amber-200/30 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[460px] rounded-full bg-rose-200/20 blur-[100px]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-3 pt-6 sm:px-6 sm:pt-12 lg:px-8">
        {/* 返回按钮：浮在左上角，与词海寻踪对齐 */}
        <button
          onClick={() => {
            if (active) {
              setActive(null);
            } else {
              navigate("/");
            }
          }}
          className="absolute left-0 top-0 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] text-slate-600 backdrop-blur-md transition-colors hover:border-amber-300 hover:text-amber-700 sm:left-4 sm:top-0 sm:px-3.5 sm:py-2 sm:text-xs lg:left-6 lg:text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {active ? "书架" : "摸鱼舱"}
        </button>

        {!active ? (
          <BookShelf onPick={setActive} />
        ) : (
          <Reader novel={active} onBack={() => setActive(null)} />
        )}
      </div>
    </div>
  );
}

/* ---------------- 书架视图 ---------------- */

function BookShelf({ onPick }: { onPick: (n: LocalNovelMeta) => void }) {
  return (
    <>
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
          <Library className="h-3.5 w-3.5 text-amber-700" />
          <span className="font-heading text-[10px] font-bold tracking-[0.25em] text-amber-700">
            LIBRARY
          </span>
        </div>
        <h1 className="font-display text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
          摸鱼<span className="gradient-text-soft">书房</span>
        </h1>
        <p className="mt-2 text-sm text-slate-500 md:text-base">
          摸鱼间隙 · 读一两章书
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {LOCAL_NOVELS.map((n, i) => (
          <motion.button
            key={n.id}
            onClick={() => {
              setLastReadNovelId(n.id);
              onPick(n);
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-6 text-left backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            {/* 装饰色块 */}
            <div
              className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-30"
              style={{ background: n.color }}
            />

            {/* 封面 + 书名 */}
            <div className="relative flex items-start gap-4">
              <div
                className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${n.color}, ${n.color}cc)`,
                }}
              >
                <img
                  src={n.cover}
                  alt={n.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    // 封面加载失败时隐藏 img，露出兜底色块 + 首字
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white/90">
                  {n.title[0]}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-black tracking-tight text-slate-900">
                  {n.title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">{n.author}</p>
              </div>
            </div>

            {/* 简介 */}
            <p className="relative mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
              {n.summary}
            </p>

            {/* 阅读入口 */}
            <div
              className="relative mt-4 flex items-center gap-1.5 text-xs font-medium transition-colors group-hover:gap-2.5"
              style={{ color: n.color }}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>开始阅读</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </motion.button>
        ))}
      </div>

    </>
  );
}

/* ---------------- 阅读器视图 ---------------- */

function Reader({ novel, onBack }: { novel: LocalNovelMeta; onBack: () => void }) {
  // 容器 ref（epub.js 渲染挂载点）
  const viewerRef = useRef<HTMLDivElement | null>(null);
  // Book / Rendition 实例（不触发 re-render）
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showToc, setShowToc] = useState(false);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [currentHref, setCurrentHref] = useState("");
  const [metaTitle, setMetaTitle] = useState(novel.title);
  const [metaAuthor, setMetaAuthor] = useState(novel.author);

  /** 扁平化 epub.js 的 toc（嵌套结构） */
  const flattenToc = useCallback((items: any[], out: TocItem[] = []) => {
    for (const it of items) {
      if (it.label && it.href) {
        out.push({ label: it.label.trim(), href: it.href });
      }
      if (Array.isArray(it.subitems) && it.subitems.length > 0) {
        flattenToc(it.subitems, out);
      }
    }
    return out;
  }, []);

  /** 初始化 epub.js Book + Rendition */
  useEffect(() => {
    let destroyed = false;
    setLoading(true);
    setError("");

    async function init() {
      try {
        // 1. 下载 epub 文件到 ArrayBuffer
        const res = await fetch(novel.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();

        // 2. 解析 epub
        const book = ePub(buf);
        bookRef.current = book;
        await book.ready;

        if (destroyed) return;

        // 3. 读取元数据（书名 / 作者）
        const info = book.packaging?.metadata;
        if (info?.title) setMetaTitle(info.title);
        if (info?.creator) setMetaAuthor(info.creator);

        // 4. 生成目录
        const navigation = await book.loaded.navigation;
        if (destroyed) return;
        setToc(flattenToc(navigation.toc));

        // 5. 挂载 rendition 到 viewer 容器
        if (!viewerRef.current) return;
        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "none",
          flow: "paginated",
          allowScriptedContent: false,
          manager: "default",
        });
        renditionRef.current = rendition;

        // 6. 应用阅读主题（亮色 + 舒适字号 + 行高）
        rendition.themes.register("custom", {
          body: {
            background: "#fafaf9",
            color: "#1e293b",
            "font-family":
              '"Noto Serif SC", "Source Han Serif SC", "Songti SC", serif',
            "font-size": "18px",
            "line-height": "1.9",
            padding: "0 8px",
          },
          p: {
            "text-indent": "2em",
            margin: "0 0 0.8em 0",
          },
          h1: { "text-align": "center", margin: "1.5em 0 1em" },
          h2: { "text-align": "center", margin: "1.2em 0 0.8em" },
          a: { color: "#0369a1" },
        });
        rendition.themes.select("custom");

        // 7. 恢复进度，或从开头开始
        const savedCfi = getProgress(novel.id);
        if (savedCfi) {
          await rendition.display(savedCfi);
        } else {
          await rendition.display();
        }
        if (destroyed) return;

        // 8. 监听翻页 → 保存进度 + 更新当前章节
        const onRelocated = (location: any) => {
          const cfi = location?.start?.cfi;
          if (cfi) {
            saveProgress(novel.id, cfi);
            // 找到当前章节
            const at = location?.start?.href;
            if (at) setCurrentHref(at);
          }
        };
        rendition.on("relocated", onRelocated);

        setLoading(false);
      } catch (e) {
        if (destroyed) return;
        setError(e instanceof Error ? e.message : "加载失败");
        setLoading(false);
      }
    }

    init();

    return () => {
      destroyed = true;
      // 清理 rendition 与 book，避免内存泄漏
      try {
        renditionRef.current?.destroy();
      } catch {
        /* ignore */
      }
      try {
        bookRef.current?.destroy();
      } catch {
        /* ignore */
      }
      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [novel, flattenToc]);

  /** 键盘左右键翻页 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!renditionRef.current) return;
      if (e.key === "ArrowLeft") renditionRef.current.prev();
      else if (e.key === "ArrowRight") renditionRef.current.next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goPrev = () => renditionRef.current?.prev();
  const goNext = () => renditionRef.current?.next();

  /** 跳转到指定章节 */
  const jumpTo = async (href: string) => {
    if (!renditionRef.current) return;
    setShowToc(false);
    setLoading(true);
    try {
      await renditionRef.current.display(href);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 顶部信息条 */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ background: novel.color }}
            />
            <h1 className="truncate font-display text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              {metaTitle}
            </h1>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{metaAuthor}</p>
        </div>

        <button
          onClick={() => setShowToc(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-600 backdrop-blur-md transition-colors hover:border-amber-300 hover:text-amber-700"
        >
          <Library className="h-4 w-4" />
          目录
        </button>
      </div>

      {/* 阅读器容器：固定高度，避免 iframe 撑高卡顿 */}
      <div className="relative mx-auto max-w-3xl">
        <div
          className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-[#fafaf9] shadow-sm"
          style={{ height: "min(72vh, 820px)" }}
        >
          {/* epub.js 挂载点 */}
          <div ref={viewerRef} className="h-full w-full" />

          {/* 加载遮罩 */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#fafaf9]/90 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              <p className="text-sm text-slate-500">正在解析 epub...</p>
            </div>
          )}

          {/* 错误态 */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#fafaf9]/95 p-6 text-center">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p className="text-sm font-medium text-slate-700">epub 加载失败</p>
              <p className="text-xs text-slate-500">{error}</p>
              <button
                onClick={onBack}
                className="mt-2 rounded-xl bg-amber-600 px-4 py-2 text-sm text-white transition-colors hover:bg-amber-700"
              >
                返回书架
              </button>
            </div>
          )}
        </div>

        {/* 上一页 / 下一页 */}
        {!error && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={goPrev}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm text-slate-600 transition-all hover:border-amber-300 hover:text-amber-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </button>

            <span className="font-mono text-xs text-slate-400">
              ← / → 键翻页
            </span>

            <button
              onClick={goNext}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-amber-600/30 transition-all hover:bg-amber-700 disabled:opacity-40"
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* 目录抽屉 */}
      {showToc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setShowToc(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">
                章节目录
              </h3>
              <button
                onClick={() => setShowToc(false)}
                className="text-sm text-slate-400 hover:text-slate-600"
              >
                关闭
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto"
              data-lenis-prevent
            >
              {toc.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  此 epub 没有目录信息
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {toc.map((ch, i) => {
                    const active = currentHref === ch.href.split("#")[0];
                    return (
                      <button
                        key={i}
                        onClick={() => jumpTo(ch.href)}
                        className={`rounded-xl px-4 py-2.5 text-left text-sm transition-colors ${
                          active
                            ? "bg-amber-50 font-bold text-amber-700"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="font-mono text-[10px] text-slate-400">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="ml-2">{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

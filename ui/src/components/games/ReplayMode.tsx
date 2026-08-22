/**
 * ReplayMode — 回溯模式（亮色蓝调版）
 * 列出本机历史完成的所有游戏记录，可点击回看推理过程
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Crown,
  History,
  Home,
  RotateCcw,
  Target,
  Trophy,
  X,
} from "lucide-react";
import GuessCard from "./GuessCard";
import { useNavigate } from "react-router-dom";

export interface ReplayRecord {
  key: string;
  mode: "daily" | "infinite" | "custom";
  target: string;
  date: string;
  guesses: { word: string; similarity: number; time: string }[];
  best: number;
  solved: boolean;
  durationMs: number;
}

const STORAGE_KEY = "cihai-xunzong-history";

function loadAll(): ReplayRecord[] {
  try {
    const map: Record<string, ReplayRecord["guesses"]> = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}",
    );
    const records: ReplayRecord[] = [];
    for (const [k, v] of Object.entries(map)) {
      if (!Array.isArray(v) || v.length === 0) continue;
      const best = v.reduce((m, g) => Math.max(m, g.similarity), 0);
      const solved = v.some((g) => g.similarity >= 99);
      const first = v[0];
      const [modePart, ...rest] = k.split(":");
      const mode = (modePart === "daily" || modePart === "infinite" || modePart === "custom"
        ? modePart
        : "infinite") as ReplayRecord["mode"];
      records.push({
        key: k,
        mode,
        target: rest.join(":"),
        date: first.time,
        guesses: v,
        best,
        solved,
        durationMs: 0,
      });
    }
    return records.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch {
    return [];
  }
}

function modeLabel(m: ReplayRecord["mode"]) {
  return m === "daily" ? "每日" : m === "infinite" ? "无限" : "自定义";
}

export default function ReplayMode({
  onBack,
}: {
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ReplayRecord[]>([]);
  const [active, setActive] = useState<ReplayRecord | null>(null);

  useEffect(() => {
    setRecords(loadAll());
  }, []);

  const stats = useMemo(() => {
    const total = records.length;
    const solved = records.filter((r) => r.solved).length;
    const avgBest =
      total > 0 ? records.reduce((m, r) => m + r.best, 0) / total : 0;
    return { total, solved, avgBest };
  }, [records]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-600 backdrop-blur-md transition-all hover:border-blue-300 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          返回
        </button>
        <button
          onClick={() => {
            navigate("/");
          }}
          className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-600 backdrop-blur-md transition-all hover:border-amber-300 hover:text-amber-700"
        >
          <Home className="h-4 w-4" />
          摸鱼舱
        </button>
      </div>

      {/* 标题区 */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
            <History className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-heading text-[10px] font-bold tracking-[0.25em] text-blue-600">
              REPLAY
            </span>
          </div>
          <h2 className="font-display text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            回溯<span className="gradient-text-soft">记录</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            回顾所有完成局，看自己是怎么逼近答案的。
          </p>
        </div>

        {stats.total > 0 && (
          <div className="flex gap-2">
            <MiniStat label="局数" value={String(stats.total)} color="#2563eb" />
            <MiniStat
              label="猜中"
              value={String(stats.solved)}
              color="#10b981"
            />
            <MiniStat
              label="平均最佳"
              value={`${stats.avgBest.toFixed(1)}%`}
              color="#8b5cf6"
            />
          </div>
        )}
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/70 bg-white/70 px-6 py-16 text-center backdrop-blur-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <RotateCcw className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="font-display text-base font-bold text-slate-900">
              还没有游戏记录
            </p>
            <p className="mt-1 text-xs text-slate-500">
              完成一局猜词后即可在这里回溯推理过程
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {records.map((r) => (
            <button
              key={r.key}
              onClick={() => setActive(r)}
              className="group flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 text-left backdrop-blur-md transition-all hover:border-blue-300 hover:bg-blue-50/50"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: r.solved
                    ? "rgba(16,185,129,0.12)"
                    : "rgba(37,99,235,0.1)",
                }}
              >
                {r.solved ? (
                  <Trophy className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Target className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider"
                    style={{
                      background: r.solved
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(37,99,235,0.12)",
                      color: r.solved ? "#10b981" : "#2563eb",
                    }}
                  >
                    {modeLabel(r.mode)}
                  </span>
                  <span className="truncate font-display text-sm font-bold text-slate-900">
                    {r.target}
                  </span>
                </div>
                <span className="mt-0.5 block font-mono text-[10px] text-slate-500">
                  {r.guesses.length} 次猜测 · 最佳 {r.best.toFixed(2)}%
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                {r.date}
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
            </button>
          ))}
        </div>
      )}

      {/* 详情弹窗 */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                      background: active.solved
                        ? "rgba(16,185,129,0.12)"
                        : "rgba(37,99,235,0.1)",
                    }}
                  >
                    {active.solved ? (
                      <Crown className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Target className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider"
                        style={{
                          background: active.solved
                            ? "rgba(16,185,129,0.15)"
                            : "rgba(37,99,235,0.12)",
                          color: active.solved ? "#10b981" : "#2563eb",
                        }}
                      >
                        {modeLabel(active.mode)}
                      </span>
                      <span className="font-display text-base font-bold text-slate-900">
                        {active.target}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                      {active.guesses.length} 次猜测 · 最佳{" "}
                      {active.best.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActive(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="关闭"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4">
                <div className="flex flex-col gap-2">
                  {[...active.guesses]
                    .sort((a, b) => b.similarity - a.similarity)
                    .map((g, i) => (
                      <GuessCard
                        key={g.word + i}
                        word={g.word}
                        similarity={g.similarity}
                        rank={i}
                        index={i}
                      />
                    ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EscCloser active={!!active} onClose={() => setActive(null)} />
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 backdrop-blur-md">
      <span
        className="font-mono text-base font-bold tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
      <span className="font-heading text-[9px] tracking-[0.2em] text-slate-500">
        {label}
      </span>
    </div>
  );
}

function EscCloser({
  active,
  onClose,
}: {
  active: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onClose]);
  return null;
}

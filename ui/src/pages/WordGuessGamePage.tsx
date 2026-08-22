/**
 * 词海寻踪 — 猜词游戏页（游戏化重构版）
 *
 * 布局：
 *   顶部：GameHeader（标题 + 统计：今日/连续/最高记录）
 *   模式 Tab：每日 / 无限 / 出题 / 回溯
 *   主舞台（左/上）：SimilarityScore（大数字 + 热度 + 进度 + 趋势）+ 最近反馈 + GuessInput
 *   游戏轨迹（右/下）：GuessHistory 卡片流
 *
 * 业务逻辑全部保留：4 模式、token 加载、历史持久化、分享出题、重复猜测检查、胜利检测。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Check,
  Copy,
  History,
  Infinity as InfinityIcon,
  Lightbulb,
  Link2,
  PenLine,
  RotateCcw,
  Send,
} from "lucide-react";
import {
  computeSimilarity,
  encryptWord,
  getDailyWord,
  getRandomWord,
} from "@/lib/guessWordApi";
import { buildPuzzleUrl, decodePuzzle } from "@/lib/puzzleLink";
import { heatTier } from "@/lib/gameTiers";
import AmbientBackground from "@/components/games/AmbientBackground";
import GameHeader from "@/components/games/GameHeader";
import SimilarityScore from "@/components/games/SimilarityScore";
import GuessInput from "@/components/games/GuessInput";
import GuessHistory, { type GuessItem } from "@/components/games/GuessHistory";
import WinCelebration from "@/components/games/WinCelebration";
import ReplayMode from "@/components/games/ReplayMode";

type Mode = "daily" | "infinite" | "custom" | "replay";

interface GuessRow {
  id: number;
  word: string;
  similarity: number;
  inCorpus: boolean;
  time: string;
  ts: number;
}

const MODE_CONFIG: Record<
  Mode,
  { label: string; icon: typeof Calendar; color: string }
> = {
  daily: { label: "每日", icon: Calendar, color: "#2563eb" },
  infinite: { label: "无限", icon: InfinityIcon, color: "#7c3aed" },
  custom: { label: "出题", icon: PenLine, color: "#db2777" },
  replay: { label: "回溯", icon: History, color: "#059669" },
};

const STORAGE_KEY = "cihai-xunzong-history";

function nowTime() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadHistory(): Record<string, GuessRow[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveHistory(map: Record<string, GuessRow[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** 从历史计算统计：今日猜测次数 / 连续天数 / 最少猜中次数 */
function computeStats(): {
  todayCount: number;
  streakDays: number;
  bestRecord: number | null;
} {
  const all = loadHistory();
  const tk = todayKey();
  const todayCount = (all[`daily:${tk}`] || []).length;

  // 连续天数：从今天往前数，每天 daily:date 至少 1 条
  let streakDays = 0;
  const cursor = new Date();
  while (true) {
    const k = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if ((all[`daily:${k}`] || []).length > 0) {
      streakDays++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // 最高记录：所有 daily:* 中已猜中的最少猜测次数
  let bestRecord: number | null = null;
  for (const k of Object.keys(all)) {
    if (!k.startsWith("daily:")) continue;
    const rows = all[k];
    if (rows.some((r) => r.similarity >= 99)) {
      if (bestRecord === null || rows.length < bestRecord) {
        bestRecord = rows.length;
      }
    }
  }

  return { todayCount, streakDays, bestRecord };
}

export default function WordGuessGamePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(() => {
    const m = new URLSearchParams(
      window.location.hash.split("?")[1] || "",
    ).get("mode");
    return m === "daily" || m === "infinite" || m === "custom" || m === "replay"
      ? m
      : "daily";
  });

  const [targetToken, setTargetToken] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loadingTarget, setLoadingTarget] = useState(true);
  const [targetError, setTargetError] = useState("");
  const [answer, setAnswer] = useState("");

  const [input, setInput] = useState("");
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [lastSubmittedId, setLastSubmittedId] = useState<number | null>(null);

  const [customWord, setCustomWord] = useState("");
  const [customHint, setCustomHint] = useState("");
  const [customStarted, setCustomStarted] = useState(false);
  const [puzzleLink, setPuzzleLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [hint, setHint] = useState("");
  const [isSolver, setIsSolver] = useState(false);

  const [won, setWon] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [now, setNow] = useState<number>(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [finalDurationMs, setFinalDurationMs] = useState<number>(0);
  const [finalGuessCount, setFinalGuessCount] = useState<number>(0);

  /** 顶部统计 */
  const [stats, setStats] = useState({
    todayCount: 0,
    streakDays: 0,
    bestRecord: null as number | null,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const nextIdRef = useRef(1);

  const historyKey = useMemo(() => {
    if (mode === "daily") return `daily:${targetDate || targetToken}`;
    if (mode === "infinite") return `infinite:${targetToken}`;
    if (mode === "custom") return `custom:${targetToken}`;
    return "";
  }, [mode, targetToken, targetDate]);

  // 刷新统计
  const refreshStats = useCallback(() => {
    setStats(computeStats());
  }, []);

  const loadTarget = useCallback(
    async (m: Mode) => {
      if (m === "replay") return;
      if (m === "custom") {
        const q = searchParams.get("q");
        const puzzle = q ? decodePuzzle(q) : null;
        if (puzzle && puzzle.t) {
          // 答题方
          setLoadingTarget(false);
          setTargetToken(puzzle.t);
          setTargetDate("来自分享");
          setHint(puzzle.h);
          setIsSolver(true);
          setAnswer("");
          setGuesses([]);
          setWon(false);
          setCustomStarted(true);
          setStartedAt(Date.now());
          const all = loadHistory();
          const key = `custom:${puzzle.t}`;
          const rows = all[key] || [];
          setGuesses(rows);
          nextIdRef.current = rows.reduce((mx, r) => Math.max(mx, r.id + 1), 1);
          setWon(rows.some((r) => r.similarity >= 99));
          setTimeout(() => inputRef.current?.focus(), 100);
          return;
        }
        // 出题方
        setLoadingTarget(false);
        setTargetToken("");
        setTargetDate("");
        setHint("");
        setAnswer("");
        setIsSolver(false);
        setGuesses([]);
        setWon(false);
        setCustomStarted(false);
        setCustomWord("");
        setCustomHint("");
        setPuzzleLink("");
        setLinkCopied(false);
        setStartedAt(0);
        setNow(0);
        return;
      }
      setLoadingTarget(true);
      setTargetError("");
      setTargetToken("");
      setTargetDate("");
      setHint("");
      setAnswer("");
      setIsSolver(false);
      setGuesses([]);
      setWon(false);
      setStartedAt(0);
      setNow(0);
      try {
        if (m === "daily") {
          const r = await getDailyWord();
          setTargetToken(r.token);
          setTargetDate(r.date);
        } else if (m === "infinite") {
          const r = await getRandomWord();
          setTargetToken(r.token);
        }
        setStartedAt(Date.now());
      } catch (e) {
        setTargetError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoadingTarget(false);
      }
    },
    [searchParams],
  );

  useEffect(() => {
    loadTarget(mode);
    refreshStats();
  }, [mode, loadTarget, refreshStats]);

  // 切换到非 custom 模式时清除 puzzle 参数
  useEffect(() => {
    if (mode !== "custom" && searchParams.get("q")) {
      setSearchParams({}, { replace: true });
    }
  }, [mode, searchParams, setSearchParams]);

  // 加载本局历史
  useEffect(() => {
    if (!targetToken || mode === "custom" || mode === "replay") return;
    const all = loadHistory();
    const rows = all[historyKey] || [];
    setGuesses(rows);
    nextIdRef.current = rows.reduce((m, r) => Math.max(m, r.id + 1), 1);
    const alreadyWon = rows.some((r) => r.similarity >= 99);
    setWon(alreadyWon);
    if (alreadyWon) {
      setFinalGuessCount(rows.length);
      setFinalDurationMs(0);
    }
  }, [historyKey, targetToken, mode]);

  // 计时器
  useEffect(() => {
    if (!startedAt || won) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt, won]);

  // 自动聚焦
  useEffect(() => {
    if (mode !== "replay" && targetToken && !won) {
      inputRef.current?.focus();
    }
  }, [mode, targetToken, won, guesses.length]);

  const generateLink = async () => {
    const w = customWord.trim();
    if (!w || encrypting) return;
    const h = customHint.trim();
    setEncrypting(true);
    try {
      const { token } = await encryptWord(w);
      setPuzzleLink(buildPuzzleUrl({ t: token, h }));
      setLinkCopied(false);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "加密失败");
    } finally {
      setEncrypting(false);
    }
  };

  const tryMyself = async () => {
    const w = customWord.trim();
    if (!w || encrypting) return;
    const h = customHint.trim();
    setEncrypting(true);
    try {
      const { token } = await encryptWord(w);
      setTargetToken(token);
      setTargetDate("自定义");
      setHint(h);
      setAnswer("");
      setIsSolver(false);
      setGuesses([]);
      setWon(false);
      setCustomStarted(true);
      setStartedAt(Date.now());
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "加密失败");
    } finally {
      setEncrypting(false);
    }
  };

  const copyLink = async () => {
    if (!puzzleLink) return;
    try {
      await navigator.clipboard.writeText(puzzleLink);
    } catch {
      const input = document.getElementById(
        "puzzle-link-input",
      ) as HTMLInputElement | null;
      if (input) {
        input.select();
        document.execCommand("copy");
      }
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const submit = async () => {
    const guess = input.trim();
    if (!guess || !targetToken || submitting || won) return;
    if (guesses.some((g) => g.word === guess)) {
      setSubmitError("这个词已经猜过了，无法再猜");
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const r = await computeSimilarity(guess, targetToken);
      const id = nextIdRef.current++;
      const row: GuessRow = {
        id,
        word: guess,
        similarity: r.similarity,
        inCorpus: r.inCorpus,
        time: nowTime(),
        ts: Date.now(),
      };
      setLastSubmittedId(id);
      setTimeout(() => setLastSubmittedId(null), 2000);
      const sorted = [...guesses, row].sort((a, b) => {
        if (b.similarity !== a.similarity) return b.similarity - a.similarity;
        return a.ts - b.ts;
      });
      setGuesses(sorted);
      const all = loadHistory();
      all[historyKey] = [...(all[historyKey] || []), row].sort(
        (a, b) => b.similarity - a.similarity || a.ts - b.ts,
      );
      saveHistory(all);
      refreshStats();
      if (r.similarity >= 99) {
        setWon(true);
        if (r.answer) setAnswer(r.answer);
        setFinalDurationMs(startedAt ? Date.now() - startedAt : 0);
        setFinalGuessCount(sorted.length);
        setShowWinModal(true);
      }
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 0);
      // 提交后输入框可能被新增的「刚才猜的」反馈条挤出视口，等 DOM 更新后自动滚入可见
      // 仅在真正提交新猜测时触发，避免从主页进入或切换模式加载历史时滚动整页
      setTimeout(() => {
        const el = inputRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const viewportH = window.innerHeight;
        // 输入框底部若距视口底部不足 80px，才滚动（避免轻微溢出也跳动）
        if (rect.bottom > viewportH - 80) {
          const lenis = window.__lenisInstance;
          if (lenis) {
            const targetY = window.scrollY + rect.top - viewportH * 0.4;
            lenis.scrollTo(targetY, { duration: 0.8 });
          } else {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 200);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "请求失败");
      setTimeout(() => inputRef.current?.focus(), 0);
    } finally {
      setSubmitting(false);
    }
  };

  // 派生值
  const bestSim = guesses.reduce((m, r) => Math.max(m, r.similarity), 0);
  const lastGuess = useMemo(
    () =>
      guesses.length
        ? guesses.reduce((a, b) => (a.ts > b.ts ? a : b))
        : null,
    [guesses],
  );
  /** 趋势数据：按提交时间升序的相关度 */
  const trend = useMemo(
    () => [...guesses].sort((a, b) => a.ts - b.ts).map((g) => g.similarity),
    [guesses],
  );
  const historyItems: GuessItem[] = useMemo(
    () => guesses.map((g) => ({ id: g.id, word: g.word, similarity: g.similarity, ts: g.ts })),
    [guesses],
  );

  // 回溯模式
  if (mode === "replay") {
    return (
      <div className="relative min-h-[100svh] pb-20 pt-6 sm:pt-8">
        <AmbientBackground />
        <div className="relative z-10 w-full px-3 sm:px-6 lg:px-8">
          <ReplayMode onBack={() => setMode("daily")} />
        </div>
      </div>
    );
  }

  const showCustomInput = mode === "custom" && !customStarted;

  return (
    <div className="relative min-h-[100svh] pb-16">
      <AmbientBackground />

      <div className="relative z-10 w-full px-3 pt-6 sm:px-6 sm:pt-12 lg:px-8">
        {/* 顶部：标题 + 统计 */}
        <GameHeader
          todayCount={stats.todayCount}
          streakDays={stats.streakDays}
          bestRecord={stats.bestRecord}
          showTodaySolved={mode === "daily"}
          todaySolvedCount={1127 + (won ? 1 : 0)}
          onBack={() => {
            navigate("/");
          }}
        />

        {/* 模式 Tab：移动端可横向滚动，避免 4 个按钮挤压 */}
        <div className="mt-5 flex items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/70 p-1.5 backdrop-blur-xl sm:mx-auto sm:mt-7 sm:w-fit [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => {
            const Icon = MODE_CONFIG[m].icon;
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                  active
                    ? "text-white"
                    : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mode-tab"
                    className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 shadow-md shadow-blue-500/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="h-3.5 w-3.5" />
                <span>{MODE_CONFIG[m].label}</span>
              </button>
            );
          })}
        </div>

        {/* 目标状态条 */}
        {targetDate && !showCustomInput && (
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                {loadingTarget ? (
                  <span className="relative inline-flex h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                ) : targetError ? (
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
                ) : won ? (
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                ) : (
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                )}
              </span>
              <span className="font-heading text-[10px] tracking-[0.2em] text-slate-500">
                {loadingTarget
                  ? "目标准备中"
                  : targetError
                  ? "加载失败"
                  : won
                  ? "已揭晓"
                  : mode === "daily"
                  ? `今日词 · ${targetDate}`
                  : `本局 #${(historyKey || "").slice(-6)}`}
              </span>
            </div>
          </div>
        )}

        {/* 出题输入 */}
        {showCustomInput && (
          <CustomPuzzleForm
            customWord={customWord}
            setCustomWord={setCustomWord}
            customHint={customHint}
            setCustomHint={setCustomHint}
            encrypting={encrypting}
            onGenerate={generateLink}
            onTryMyself={tryMyself}
            puzzleLink={puzzleLink}
            linkCopied={linkCopied}
            onCopy={copyLink}
          />
        )}

        {/* 主舞台 + 游戏轨迹：整体居中限宽，左右两栏顶对齐 */}
        {mode !== "custom" || customStarted ? (
          <div className="mx-auto mt-5 grid max-w-[1760px] grid-cols-1 gap-4 sm:mt-8 sm:gap-6 lg:mt-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:items-start">
            {/* 左：主舞台：内容自然撑开，输入框始终可见 */}
            <div className="flex flex-col gap-4 sm:gap-5">
              {/* 提示卡片 */}
              {hint && (
                <div className="overflow-hidden rounded-2xl border border-pink-200/70 bg-white/70 backdrop-blur-md">
                  <div className="flex items-center gap-2 border-b border-slate-200/70 px-4 py-2.5">
                    <Lightbulb className="h-3.5 w-3.5 text-pink-500" />
                    <span className="font-display text-xs font-bold tracking-wider text-slate-900">
                      出题人提示
                    </span>
                    {isSolver && (
                      <span className="ml-auto rounded-full border border-pink-200 bg-pink-50 px-2 py-0.5 font-heading text-[9px] tracking-[0.2em] text-pink-600">
                        来自分享
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                      {hint}
                    </p>
                  </div>
                </div>
              )}

              {/* 核心舞台：相似度 */}
              <div className="rounded-2xl border border-slate-200/70 bg-white/60 px-3 py-5 backdrop-blur-xl sm:rounded-3xl sm:px-6 sm:py-6">
                {targetError ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <span className="text-sm text-pink-600">{targetError}</span>
                    <button
                      onClick={() => loadTarget(mode)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:text-blue-600"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      重试
                    </button>
                  </div>
                ) : (
                  <SimilarityScore
                    value={bestSim}
                    trend={trend}
                    loading={loadingTarget}
                    won={won}
                    empty={guesses.length === 0}
                  />
                )}
              </div>

              {/* 最近一次猜测反馈：固定 key，新猜测只更新内容，避免整卡 unmount/mount 抖动 */}
              <AnimatePresence>
                {targetToken && !targetError && lastGuess && !won && (
                  <LastGuessStrip
                    key="last-guess"
                    word={lastGuess.word}
                    similarity={lastGuess.similarity}
                    isBest={lastGuess.similarity >= bestSim - 0.01}
                    isNew={lastSubmittedId === lastGuess.id}
                  />
                )}
              </AnimatePresence>

              {/* 输入框 */}
              {targetToken && !targetError && (
                <GuessInput
                  ref={inputRef}
                  value={input}
                  onChange={setInput}
                  onSubmit={submit}
                  submitting={submitting}
                  won={won}
                  error={submitError}
                />
              )}

              {/* 胜利快捷条 */}
              {won && (
                <button
                  onClick={() => setShowWinModal(true)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 px-4 py-3 text-left backdrop-blur-md transition-colors hover:bg-amber-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏆</span>
                    <div className="flex flex-col">
                      <span className="font-display text-sm font-bold text-slate-900">
                        已猜中 · 点击查看战绩
                      </span>
                      <span className="truncate text-xs text-slate-600">
                        答案：
                        <span className="font-display font-bold text-amber-700">
                          {answer || "已揭晓"}
                        </span>
                      </span>
                    </div>
                  </div>
                  <RotateCcw className="h-4 w-4 shrink-0 text-amber-600" />
                </button>
              )}
            </div>

            {/* 右：游戏轨迹：固定高度，内部滚动，与左栏顶部对齐 */}
            <div className="h-[380px] sm:h-[460px] lg:h-[calc(100vh-220px)] lg:min-h-[480px] lg:sticky lg:top-6">
              <GuessHistory
                items={historyItems}
                lastSubmittedId={lastSubmittedId}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* 胜利庆祝弹窗 */}
      <WinCelebration
        open={showWinModal}
        onClose={() => setShowWinModal(false)}
        onRestart={() => {
          setShowWinModal(false);
          refreshStats();
          // daily 猜中后「再来一局无限」应切换到 infinite 模式；
          // 其他模式直接重新加载本模式新题
          if (mode === "daily") {
            setMode("infinite");
          } else {
            loadTarget(mode);
          }
        }}
        answer={answer}
        guessCount={finalGuessCount || guesses.length}
        durationMs={finalDurationMs}
        mode={mode}
      />
    </div>
  );
}

/* ============ 最近一次猜测反馈条 ============ */

function LastGuessStrip({
  word,
  similarity,
  isBest,
  isNew,
}: {
  word: string;
  similarity: number;
  isBest: boolean;
  isNew: boolean;
}) {
  const tier = heatTier(similarity);
  const v = Math.max(0, Math.min(100, similarity));
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md"
      style={{
        borderLeft: `3px solid ${tier.color}`,
        boxShadow: isNew
          ? `0 8px 24px -10px rgba(${tier.rgb},0.4)`
          : `0 4px 12px -6px rgba(15,23,42,0.08)`,
      }}
    >
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-heading text-[9px] tracking-[0.2em] text-slate-400">
            你刚才猜的
          </span>
          <span
            className="truncate font-display text-base font-bold text-slate-900"
            title={word}
          >
            {word}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span
            className="font-mono text-xl font-black leading-none tabular-nums"
            style={{ color: tier.color }}
          >
            {v.toFixed(2)}
            <span className="text-sm">%</span>
          </span>
          <span className="text-[10px]" style={{ color: tier.color }}>
            {tier.emoji} {tier.label}
            {isBest && " · 最佳"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ============ 自定义出题表单 ============ */

function CustomPuzzleForm({
  customWord,
  setCustomWord,
  customHint,
  setCustomHint,
  encrypting,
  onGenerate,
  onTryMyself,
  puzzleLink,
  linkCopied,
  onCopy,
}: {
  customWord: string;
  setCustomWord: (v: string) => void;
  customHint: string;
  setCustomHint: (v: string) => void;
  encrypting: boolean;
  onGenerate: () => void;
  onTryMyself: () => void;
  puzzleLink: string;
  linkCopied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mx-auto mt-5 w-full max-w-2xl rounded-2xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur-xl sm:mt-8 sm:rounded-3xl sm:p-6 lg:p-8">
      <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-slate-900 sm:mb-6 sm:text-lg">
        <PenLine className="h-5 w-5 text-blue-600" />
        你来出题
      </h3>

      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center justify-between text-[10px] tracking-[0.2em] text-slate-400">
            <span>答案</span>
            <span className="font-mono tabular-nums">
              {customWord.length}/10
            </span>
          </label>
          <input
            value={customWord}
            onChange={(e) => setCustomWord(e.target.value.slice(0, 10))}
            onKeyDown={(e) => e.key === "Enter" && customWord.trim() && onGenerate()}
            placeholder="输入要猜的词语"
            maxLength={10}
            autoFocus
            className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="flex items-center justify-between text-[10px] tracking-[0.2em] text-slate-400">
            <span>提示</span>
            <span className="font-mono tabular-nums">
              {customHint.length}/100
            </span>
          </label>
          <textarea
            value={customHint}
            onChange={(e) => setCustomHint(e.target.value.slice(0, 100))}
            placeholder="给猜题者一点线索，可不填"
            maxLength={100}
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={onGenerate}
            disabled={!customWord.trim() || encrypting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            <Link2 className="h-4 w-4" />
            {encrypting ? "加密中…" : "生成分享链接"}
          </button>
          <button
            onClick={onTryMyself}
            disabled={!customWord.trim() || encrypting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            {encrypting ? "加密中…" : "我先自己试"}
          </button>
        </div>
      </div>

      {puzzleLink && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            链接已生成，分享给朋友即可让他们猜这个词
          </div>
          <div className="flex gap-2">
            <input
              id="puzzle-link-input"
              readOnly
              value={puzzleLink}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="min-w-0 flex-1 truncate rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-xs text-slate-600"
            />
            <button
              onClick={onCopy}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-medium transition-colors ${
                linkCopied
                  ? "bg-emerald-200 text-emerald-700"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {linkCopied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  复制
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 九宫寻数 — 经典数独游戏页
 *
 * 布局（参考标准数独 App + 网站亮色蓝色风格）：
 *   顶部：返回 + 标题 + 难度选择 + 计时 + 错误
 *   桌面端：左侧 9×9 棋盘，右侧数字按钮 + 功能按钮
 *   移动端：上方棋盘，下方控制
 *
 * 功能：
 *   - 四难度（入门/进阶/困难/大师）
 *   - 选中格 + 同行同列同宫高亮 + 相同数字高亮
 *   - 撤销、擦除
 *   - 错误检测（与正确解对比）
 *   - 计时器（可暂停）
 *   - 完成检测 + 胜利庆祝
 *   - 键盘 + 鼠标双输入
 *   - localStorage 持久化当前局
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Eraser,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Undo2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SudokuBackground from "@/components/games/SudokuBackground";
import WinCelebration from "@/components/games/WinCelebration";
import {
  Board,
  CellPos,
  DIFFICULTY_CONFIG,
  DIFFICULTY_ORDER,
  Difficulty,
  Notes,
  cloneBoard,
  countNumber,
  emptyNotes,
  formatTime,
  generatePuzzle,
  getBoxCells,
  isComplete,
} from "@/lib/sudoku";

/** 历史记录条目（用于撤销） */
interface HistoryEntry {
  row: number;
  col: number;
  prevValue: number;
  newValue: number;
  /** 操作前主格子的笔记快照（用于撤销恢复） */
  prevNotes: number[];
}

/** 持久化的游戏状态 */
interface SavedGame {
  puzzle: Board;
  solution: Board;
  given: boolean[][];
  current: Board;
  difficulty: Difficulty;
  mistakes: number;
  elapsed: number;
  completed: boolean;
  failed: boolean;
  /** 笔记：序列化为 number[][][]，加载时转回 Set<number>[][] */
  notes: number[][][];
}

const STORAGE_KEY = "jiugong-xunshu-save";
const STATS_KEY = "jiugong-xunshu-stats";
/** 错误次数上限：达到后游戏失败 */
const MAX_MISTAKES = 3;

/** 深拷贝笔记（Set 实例独立） */
function cloneNotes(notes: Notes): Notes {
  return notes.map((row) => row.map((s) => new Set<number>(s)));
}

/** 笔记 → 可序列化的 number[][][] */
function serializeNotes(notes: Notes): number[][][] {
  return notes.map((row) => row.map((s) => Array.from(s).sort((a, b) => a - b)));
}

/** number[][][] → 笔记 */
function deserializeNotes(arr: number[][][] | undefined): Notes {
  if (!arr || arr.length !== 9) return emptyNotes();
  return arr.map((row) => row.map((nums) => new Set<number>(nums ?? [])));
}

/** 数独数字字体：优先使用标准中文字体（苹方/微软雅黑），让阿拉伯数字风格统一 */
const CN_FONT = {
  fontFamily: '"PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Hiragino Sans GB", sans-serif',
};

/** 加载已保存的游戏 */
function loadSavedGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedGame;
    if (!data.current || !data.solution) return null;
    return data;
  } catch {
    return null;
  }
}

/** 保存游戏 */
function saveGame(state: SavedGame) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** 清除存档 */
function clearSavedGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** 统计数据 */
interface Stats {
  completed: number;
  bestTime: Record<Difficulty, number | null>;
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { completed: 0, bestTime: { easy: null, medium: null, hard: null, expert: null } };
    return JSON.parse(raw);
  } catch {
    return { completed: 0, bestTime: { easy: null, medium: null, hard: null, expert: null } };
  }
}

function saveStats(stats: Stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

/**
 * 计算格子边框样式。
 * - 最外圈（棋盘四周）：全部使用粗黑边框（border-[3px] border-black，移动端 2px）
 * - 3×3 宫边界：粗深灰边框（border-2 border-slate-800，移动端 1.5px）
 * - 单元格之间：细浅灰边框（border border-slate-300，移动端 0.5px）
 */
function borderClasses(row: number, col: number): string {
  // 上边框：最顶行用粗黑，3 的倍数行用粗深灰，其余用细浅灰
  const top =
    row === 0
      ? "border-t-[2px] border-t-black sm:border-t-[3px]"
      : row % 3 === 0
        ? "border-t-[1.5px] border-t-slate-800 sm:border-t-2"
        : "border-t-[0.5px] border-t-slate-300 sm:border-t";
  // 左边框：最左列用粗黑，3 的倍数列用粗深灰，其余用细浅灰
  const left =
    col === 0
      ? "border-l-[2px] border-l-black sm:border-l-[3px]"
      : col % 3 === 0
        ? "border-l-[1.5px] border-l-slate-800 sm:border-l-2"
        : "border-l-[0.5px] border-l-slate-300 sm:border-l";
  // 右边框：最右列用粗黑
  const right = col === 8 ? "border-r-[2px] border-r-black sm:border-r-[3px]" : "";
  // 下边框：最底行用粗黑
  const bottom = row === 8 ? "border-b-[2px] border-b-black sm:border-b-[3px]" : "";
  return `${top} ${left} ${right} ${bottom}`;
}

export default function SudokuPage() {
  const navigate = useNavigate();
  // 题目与解
  const [puzzle, setPuzzle] = useState<Board>([]);
  const [solution, setSolution] = useState<Board>([]);
  const [given, setGiven] = useState<boolean[][]>([]);
  const [board, setBoard] = useState<Board>([]);

  // 交互状态
  const [selected, setSelected] = useState<CellPos | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  /** 笔记：每格的候选数字集合（1-9） */
  const [notes, setNotes] = useState<Notes>(emptyNotes);
  /** 笔记模式：开启后点击/按键填的是候选数字而非真值 */
  const [noteMode, setNoteMode] = useState(false);

  // 游戏元数据
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<number | null>(null);

  /** 开始新游戏 */
  const newGame = useCallback((diff: Difficulty) => {
    setLoading(true);
    // 用 setTimeout 让 UI 先渲染 loading 态
    setTimeout(() => {
      const { puzzle: p, solution: s } = generatePuzzle(diff);
      const g: boolean[][] = p.map((row) => row.map((v) => v !== 0));
      setPuzzle(p);
      setSolution(s);
      setGiven(g);
      setBoard(cloneBoard(p));
      setSelected(null);
      setHistory([]);
      setNotes(emptyNotes());
      setNoteMode(false);
      setDifficulty(diff);
      setMistakes(0);
      setElapsed(0);
      setPaused(false);
      setCompleted(false);
      setFailed(false);
      setShowWin(false);
      setShowFail(false);
      setLoading(false);
      clearSavedGame();
    }, 30);
  }, []);

  /** 从存档恢复 */
  const restoreGame = useCallback((saved: SavedGame) => {
    setPuzzle(saved.puzzle);
    setSolution(saved.solution);
    setGiven(saved.given);
    setBoard(saved.current);
    setNotes(deserializeNotes(saved.notes));
    setNoteMode(false);
    setDifficulty(saved.difficulty);
    setMistakes(saved.mistakes);
    setElapsed(saved.elapsed);
    setCompleted(saved.completed);
    setFailed(saved.failed ?? false);
    setSelected(null);
    setHistory([]);
    setPaused(false);
    setShowWin(false);
    setShowFail(saved.failed ?? false);
    setLoading(false);
  }, []);

  /** 初始化：尝试恢复存档，否则新开一局 easy */
  useEffect(() => {
    const saved = loadSavedGame();
    if (saved && !saved.completed) {
      restoreGame(saved);
    } else {
      newGame("easy");
    }
  }, [newGame, restoreGame]);

  /** 计时器 */
  useEffect(() => {
    if (paused || completed || failed || loading) return;
    timerRef.current = window.setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [paused, completed, failed, loading]);

  /** 自动保存 */
  useEffect(() => {
    if (loading || !puzzle.length) return;
    const saved: SavedGame = {
      puzzle,
      solution,
      given,
      current: board,
      difficulty,
      mistakes,
      elapsed,
      completed,
      failed,
      notes: serializeNotes(notes),
    };
    saveGame(saved);
  }, [puzzle, solution, given, board, difficulty, mistakes, elapsed, completed, failed, loading, notes]);

  /** 完成检测 */
  useEffect(() => {
    if (loading || completed || failed) return;
    if (board.length && isComplete(board)) {
      setCompleted(true);
      setShowWin(true);
      // 更新统计
      const stats = loadStats();
      stats.completed += 1;
      const best = stats.bestTime[difficulty];
      if (best === null || elapsed < best) {
        stats.bestTime[difficulty] = elapsed;
      }
      saveStats(stats);
      clearSavedGame();
    }
  }, [board, loading, completed, failed, difficulty, elapsed]);

  /** 在指定格填入数字（同时清除该格及同行/列/宫的对应数字笔记） */
  const placeNumber = useCallback(
    (row: number, col: number, num: number) => {
      if (given[row][col] || completed || paused || failed) return;

      const prevValue = board[row][col];
      const prevNotes = Array.from(notes[row][col]).sort((a, b) => a - b);
      // 相同数字视为清空
      const nextValue = prevValue === num ? 0 : num;

      setBoard((prev) => {
        const next = cloneBoard(prev);
        next[row][col] = nextValue;
        return next;
      });

      // 错误检测（与原逻辑一致：填入非零且与解不符则记错）
      if (nextValue !== 0 && solution[row][col] !== nextValue) {
        setMistakes((m) => m + 1);
      }

      // 填入真值时同步清除笔记：
      // 1. 清空主格笔记
      // 2. 删除同行/列/宫里所有 num 笔记（标准数独行为）
      if (nextValue !== 0) {
        setNotes((prev) => {
          const next = cloneNotes(prev);
          next[row][col].clear();
          for (let c = 0; c < 9; c++) next[row][c].delete(nextValue);
          for (let r = 0; r < 9; r++) next[r][col].delete(nextValue);
          for (const cell of getBoxCells(row, col)) {
            next[cell.row][cell.col].delete(nextValue);
          }
          return next;
        });
      }

      setHistory((h) => [
        ...h,
        { row, col, prevValue, newValue: nextValue, prevNotes },
      ]);
    },
    [given, completed, paused, failed, solution, board, notes]
  );

  /** 切换某格的笔记数字（笔记模式下使用） */
  const toggleNote = useCallback(
    (row: number, col: number, num: number) => {
      if (given[row][col] || completed || paused || failed) return;
      // 已填真值的格子不允许加笔记
      if (board[row][col] !== 0) return;

      const prevNotes = Array.from(notes[row][col]).sort((a, b) => a - b);

      setNotes((prev) => {
        const next = cloneNotes(prev);
        const cell = next[row][col];
        if (cell.has(num)) cell.delete(num);
        else cell.add(num);
        return next;
      });

      setHistory((h) => [
        ...h,
        { row, col, prevValue: 0, newValue: 0, prevNotes },
      ]);
    },
    [given, completed, paused, failed, board, notes]
  );

  /** 失败检测：错误达到上限时触发失败 */
  useEffect(() => {
    if (failed || completed || loading) return;
    if (mistakes >= MAX_MISTAKES) {
      setFailed(true);
      setShowFail(true);
      clearSavedGame();
    }
  }, [mistakes, failed, completed, loading]);

  /** 撤销：恢复主格子的值与笔记（次要格子的笔记副作用不恢复，符合主流数独 App 行为） */
  const undo = useCallback(() => {
    if (completed || paused || failed) return;
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setBoard((prev) => {
        const next = cloneBoard(prev);
        next[last.row][last.col] = last.prevValue;
        return next;
      });
      setNotes((prev) => {
        const next = cloneNotes(prev);
        next[last.row][last.col] = new Set<number>(last.prevNotes);
        return next;
      });
      return h.slice(0, -1);
    });
  }, [completed, paused, failed]);

  /** 擦除选中格（同时清空该格笔记） */
  const eraseSelected = useCallback(() => {
    if (!selected || given[selected.row][selected.col] || completed || paused || failed) return;
    const { row, col } = selected;
    const prevValue = board[row][col];
    const prevNotes = Array.from(notes[row][col]).sort((a, b) => a - b);
    // 如果格子已有真值，则清空真值（保留笔记）
    if (prevValue !== 0) {
      setBoard((prev) => {
        const next = cloneBoard(prev);
        next[row][col] = 0;
        return next;
      });
      setHistory((h) => [
        ...h,
        { row, col, prevValue, newValue: 0, prevNotes },
      ]);
    } else {
      // 空格则清空所有笔记
      setNotes((prev) => {
        const next = cloneNotes(prev);
        next[row][col].clear();
        return next;
      });
      if (prevNotes.length > 0) {
        setHistory((h) => [
          ...h,
          { row, col, prevValue: 0, newValue: 0, prevNotes },
        ]);
      }
    }
  }, [selected, given, completed, paused, failed, board, notes]);

  /** 键盘输入 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (completed || paused || loading || failed) return;
      const key = e.key;

      // 切换笔记模式
      if (key === "n" || key === "N") {
        e.preventDefault();
        setNoteMode((m) => !m);
        return;
      }
      // 数字 1-9
      if (/^[1-9]$/.test(key)) {
        if (!selected) return;
        const num = parseInt(key);
        if (noteMode) toggleNote(selected.row, selected.col, num);
        else placeNumber(selected.row, selected.col, num);
        return;
      }
      // 删除
      if (key === "Backspace" || key === "Delete" || key === "0") {
        eraseSelected();
        return;
      }
      // 方向键
      if (selected) {
        let { row, col } = selected;
        if (key === "ArrowUp") row = Math.max(0, row - 1);
        else if (key === "ArrowDown") row = Math.min(8, row + 1);
        else if (key === "ArrowLeft") col = Math.max(0, col - 1);
        else if (key === "ArrowRight") col = Math.min(8, col + 1);
        else return;
        e.preventDefault();
        setSelected({ row, col });
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, completed, paused, loading, failed, placeNumber, toggleNote, eraseSelected, noteMode]);

  /** 选中格的高亮信息 */
  const highlight = useMemo(() => {
    if (!selected) return null;
    const { row, col } = selected;
    const selectedValue = board[row][col];
    const boxCells = getBoxCells(row, col);
    return {
      row,
      col,
      value: selectedValue,
      boxCells,
      sameValueCells: [] as CellPos[],
    };
  }, [selected, board]);

  /** 收集相同数字的格子 */
  const sameValueCells = useMemo(() => {
    if (!selected || board[selected.row][selected.col] === 0) return new Set<string>();
    const target = board[selected.row][selected.col];
    const set = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === target) set.add(`${r}-${c}`);
      }
    }
    return set;
  }, [selected, board]);

  /** 判断格子是否错误（与正确解不符） */
  const isCellError = useCallback(
    (row: number, col: number) => {
      if (given[row][col] || board[row][col] === 0) return false;
      return board[row][col] !== solution[row][col];
    },
    [board, given, solution]
  );

  /** 返回首页 */
  const goHome = () => {
    navigate("/");
  };

  /** 切换难度（开始新游戏） */
  const changeDifficulty = (diff: Difficulty) => {
    newGame(diff);
  };

  if (loading) {
    return (
      <>
        <SudokuBackground />
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
            <p className="font-heading text-sm tracking-[0.2em] text-slate-500">
              正在生成数独…
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SudokuBackground />
      <div className="relative min-h-screen px-3 pt-6 pb-4 sm:px-6 sm:pt-12 sm:pb-6 lg:px-8">
        {/* 顶部标题栏 */}
        <header className="mx-auto mb-4 flex max-w-6xl flex-col items-center gap-3 sm:mb-6 sm:gap-4">
          {/* 返回 + 标题 */}
          <div className="relative flex w-full items-center justify-center">
            <button
              onClick={goHome}
              className="absolute left-0 top-0 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] text-slate-600 backdrop-blur-md transition-colors hover:border-blue-300 hover:text-blue-600 sm:left-4 sm:top-0 sm:px-3.5 sm:py-2 sm:text-xs lg:left-6 lg:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              摸鱼舱
            </button>
            <motion.div
              initial={{ opacity: 0, y: -12, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-0.5 sm:gap-1"
            >
              <h1 className="font-display text-2xl font-black tracking-tight sm:text-4xl md:text-5xl">
                <span className="text-slate-900">九宫</span>
                <span className="gradient-text-soft">寻数</span>
              </h1>
              <p className="font-heading text-[9px] tracking-[0.25em] text-slate-500 sm:text-xs sm:tracking-[0.3em]">
                经 典 数 独 逻 辑
              </p>
            </motion.div>
          </div>

          {/* 状态栏：难度 + 计时 + 错误 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="flex w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2"
          >
            {/* 难度选择 */}
            <div className="flex items-center justify-center gap-0.5 rounded-full border border-slate-200 bg-white/70 p-0.5 backdrop-blur-md sm:gap-1 sm:p-1">
              {DIFFICULTY_ORDER.map((d) => (
                <button
                  key={d}
                  onClick={() => changeDifficulty(d)}
                  className="rounded-full px-2 py-0.5 font-heading text-[9px] font-semibold tracking-[0.05em] transition-all sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.1em]"
                  style={{
                    background: difficulty === d ? DIFFICULTY_CONFIG[d].color : "transparent",
                    color: difficulty === d ? "#fff" : "#64748b",
                  }}
                >
                  {DIFFICULTY_CONFIG[d].label}
                </button>
              ))}
            </div>
            <StatChip icon={Clock} color="#2563eb" label="用时" value={formatTime(elapsed)} />
            <StatChip icon={RotateCcw} color="#ef4444" label="错误" value={`${mistakes}/${MAX_MISTAKES}`} />
          </motion.div>
        </header>

        {/* 主区域：棋盘 + 控制面板 */}
        <main className="mx-auto max-w-6xl lg:grid lg:grid-cols-[1fr_280px] lg:items-start lg:gap-8">
          {/* 棋盘 */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-[min(94vw,640px)] sm:max-w-[min(92vw,640px)]">
              {/* 暂停遮罩 */}
              {paused && !completed && !failed && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 backdrop-blur-sm sm:gap-4">
                  <Pause className="h-8 w-8 text-slate-600 sm:h-10 sm:w-10" />
                  <p className="font-heading text-xs tracking-[0.2em] text-slate-600 sm:text-sm">已暂停</p>
                  <button
                    onClick={() => setPaused(false)}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 sm:px-5 sm:py-2 sm:text-sm"
                  >
                    <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    继续
                  </button>
                </div>
              )}

              {/* 9×9 棋盘（外边框由内部格子的 border 提供，全部粗黑） */}
              <div className="grid grid-cols-9 bg-white shadow-xl shadow-slate-300/40">
                {board.map((rowArr, r) =>
                  rowArr.map((val, c) => {
                    const isSelected = selected?.row === r && selected?.col === c;
                    const isSameRow = selected?.row === r;
                    const isSameCol = selected?.col === c;
                    const isSameBox = highlight?.boxCells.some((p) => p.row === r && p.col === c) ?? false;
                    const isSameValue = sameValueCells.has(`${r}-${c}`);
                    const isGiven = given[r][c];
                    const isError = isCellError(r, c);

                    let bg = "bg-white";
                    if (isSelected) bg = "bg-blue-200";
                    else if (isSameValue && selected) bg = "bg-amber-100";
                    else if (isSameRow || isSameCol || isSameBox) bg = "bg-blue-50";

                    let textColor = "text-blue-600";
                    if (isGiven) textColor = "text-slate-900";
                    if (isError) textColor = "text-red-500";

                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => setSelected({ row: r, col: c })}
                        className={`relative aspect-square ${borderClasses(r, c)} ${bg} flex items-center justify-center transition-colors duration-100 ${!isGiven ? "hover:bg-blue-100" : ""} ${isSelected ? "ring-1 ring-blue-400 ring-inset sm:ring-2" : ""}`}
                      >
                        {val !== 0 ? (
                          <span
                            className={`text-base font-bold ${textColor} sm:text-2xl md:text-3xl`}
                            style={CN_FONT}
                          >
                            {val}
                          </span>
                        ) : notes[r][c].size > 0 ? (
                          // 笔记：3×3 小数字网格（1-9 各占一格，未填位置留空）
                          <div className="grid h-full w-full grid-cols-3 grid-rows-3 p-0.5 sm:p-1">
                            {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                              <span
                                key={n}
                                className={`flex items-center justify-center font-mono text-[7px] text-slate-500 sm:text-[10px] md:text-xs ${
                                  notes[r][c].has(n) ? "opacity-100" : "opacity-0"
                                }`}
                                style={CN_FONT}
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 控制面板 */}
          <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:gap-4 lg:mt-0">
            {/* 数字按钮 1-9（移动端 9 列横排，桌面端 3 列竖排）。
                笔记模式下：点击切换该格的候选数字；非笔记模式下：填入真值。
                已填真值格子或剩余 0 时，笔记模式下禁用。 */}
            <div className="grid grid-cols-9 gap-1 sm:grid-cols-3 sm:gap-2 lg:grid-cols-3">
              {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
                const remaining = 9 - countNumber(board, n);
                const isDepleted = remaining === 0;
                // 笔记模式下：已填真值或失败时禁用；普通模式下：剩余为 0 或失败时禁用
                const disabled =
                  failed ||
                  (noteMode
                    ? !!selected && board[selected.row][selected.col] !== 0
                    : isDepleted);
                return (
                  <button
                    key={n}
                    onClick={() => {
                      if (!selected || failed) return;
                      if (noteMode) {
                        if (board[selected.row][selected.col] === 0) {
                          toggleNote(selected.row, selected.col, n);
                        }
                      } else if (!isDepleted) {
                        placeNumber(selected.row, selected.col, n);
                      }
                    }}
                    disabled={disabled}
                    style={CN_FONT}
                    className={`relative flex aspect-square items-center justify-center rounded-lg border text-lg font-bold transition-all sm:rounded-xl sm:text-2xl ${
                      noteMode && !disabled
                        ? "border-violet-300 bg-violet-50 text-violet-600 hover:border-violet-400 hover:bg-violet-100 active:scale-95"
                        : disabled
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
                          : "border-blue-200 bg-white text-blue-600 hover:border-blue-400 hover:bg-blue-50 active:scale-95"
                    }`}
                  >
                    {n}
                    {!isDepleted && !noteMode && (
                      <span className="absolute right-0.5 top-0.5 font-mono text-[7px] font-normal text-slate-400 sm:right-1 sm:top-1 sm:text-[9px]">
                        {remaining}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 功能按钮（撤销 / 擦除 / 笔记 / 暂停） */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <FuncButton icon={Undo2} label="撤销" onClick={undo} disabled={history.length === 0 || completed || paused || failed} />
              <FuncButton icon={Eraser} label="擦除" onClick={eraseSelected} disabled={!selected || completed || paused || failed} />
              <FuncButton
                icon={Pencil}
                label="笔记"
                active={noteMode}
                onClick={() => setNoteMode((m) => !m)}
                disabled={completed || failed}
              />
              <FuncButton
                icon={paused ? Play : Pause}
                label={paused ? "继续" : "暂停"}
                onClick={() => setPaused((p) => !p)}
                disabled={completed || failed}
              />
            </div>

            {/* 新游戏按钮 */}
            <button
              onClick={() => newGame(difficulty)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-[1.02] sm:py-3 sm:text-sm"
            >
              <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              新游戏（{DIFFICULTY_CONFIG[difficulty].label}）
            </button>

            {/* 玩法提示（移动端默认折叠，点击展开） */}
            <details className="group rounded-xl border border-slate-200 bg-white/60 backdrop-blur-md sm:open:">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 sm:py-3">
                <p className="font-heading text-[10px] tracking-[0.2em] text-slate-500 sm:text-[10px]">数独怎么玩</p>
                <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="px-3 pb-3">
                <p className="text-[11px] leading-relaxed text-slate-600">
                  将 1-9 填入 9×9 的格子，使每行、每列、每个 3×3 宫的数字都不重复。
                </p>
                <p className="mt-2.5 font-heading text-[10px] tracking-[0.2em] text-slate-500">操作</p>
                <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-slate-600">
                  <li>· 点选格子，点击数字或按键盘填入</li>
                  <li>· 黑字为题目，蓝字为自填，红字为错误</li>
                  <li>· 点击「笔记」或按 N 进入笔记模式，可在格内标记候选数字</li>
                  <li>· 填入真值时自动清除该格及同行/列/宫的对应候选</li>
                </ul>
              </div>
            </details>
          </div>
        </main>
      </div>

      {/* 胜利弹窗（复用 WinCelebration，获得彩屑特效） */}
      <WinCelebration
        open={showWin}
        onClose={() => setShowWin(false)}
        onRestart={() => newGame(difficulty)}
        answer={`${DIFFICULTY_CONFIG[difficulty].label} · 错误 ${mistakes} 次`}
        guessCount={mistakes}
        durationMs={elapsed * 1000}
        mode="custom"
      />

      {/* 失败弹窗：错误达 3 次后弹出，可重开 */}
      <AnimatePresence>
        {showFail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-rose-500/30 bg-white p-6 text-center shadow-2xl"
            >
              <button
                onClick={() => setShowFail(false)}
                className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15">
                <X className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="font-display text-2xl font-black text-slate-900">
                挑战失败
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                错误已达 {MAX_MISTAKES} 次，本局结束
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(elapsed)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <RotateCcw className="h-3.5 w-3.5" />
                  {DIFFICULTY_CONFIG[difficulty].label}
                </span>
              </div>
              <button
                onClick={() => newGame(difficulty)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition-transform hover:scale-[1.02]"
              >
                <RotateCcw className="h-4 w-4" />
                重新开始
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** 状态胶囊（复用 GameHeader 风格） */
function StatChip({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof Clock;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="inline-flex items-center justify-center gap-1 rounded-full border bg-white/70 px-2 py-1 backdrop-blur-md sm:gap-2 sm:px-3.5 sm:py-1.5"
      style={{ borderColor: `${color}30` }}
    >
      <Icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" style={{ color }} />
      <span className="font-heading text-[8px] tracking-[0.15em] text-slate-500 sm:text-[9px] sm:tracking-[0.18em]">{label}</span>
      <span className="font-mono text-[11px] font-bold tabular-nums sm:text-xs" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

/** 功能按钮 */
function FuncButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: typeof Undo2;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** 是否处于激活态（如笔记模式开启时） */
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-0.5 rounded-lg border py-2 transition-all sm:gap-1 sm:rounded-xl sm:py-3 ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
          : active
            ? "border-violet-400 bg-violet-100 text-violet-600 hover:bg-violet-200 active:scale-95"
            : "border-slate-200 bg-white/70 text-slate-600 hover:border-blue-300 hover:text-blue-600 active:scale-95"
      }`}
    >
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      <span className="font-heading text-[8px] tracking-[0.1em] sm:text-[9px]">{label}</span>
    </button>
  );
}

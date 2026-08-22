/**
 * GameHeader — 游戏顶部标题区
 *
 * - 游戏标题「词海寻踪」+ 副标题「找到隐藏词语」
 * - 统计胶囊：今日挑战次数 / 连续挑战天数 / 最高记录（最少猜测次数）
 *   每日模式下额外展示「今日猜出」人数（固定基数 1127，用户猜中后 +1）
 * - 返回入口
 */
import { motion } from "framer-motion";
import { ArrowLeft, Flame, Medal, Target, Users } from "lucide-react";

interface Props {
  todayCount: number;
  streakDays: number;
  bestRecord: number | null;
  /** 每日模式专用：今日猜出人数（含当前用户），仅当 showTodaySolved 为 true 时展示 */
  todaySolvedCount?: number;
  showTodaySolved?: boolean;
  onBack: () => void;
}

export default function GameHeader({
  todayCount,
  streakDays,
  bestRecord,
  todaySolvedCount,
  showTodaySolved = false,
  onBack,
}: Props) {
  return (
    <div className="relative flex flex-col items-center gap-4 sm:gap-5">
      {/* 返回按钮：移动端缩小，避免遮挡标题 */}
      <button
        onClick={onBack}
        className="absolute left-0 top-0 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] text-slate-600 backdrop-blur-md transition-colors hover:border-blue-300 hover:text-blue-600 sm:left-4 sm:top-0 sm:px-3.5 sm:py-2 sm:text-xs lg:left-6 lg:text-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        摸鱼舱
      </button>

      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: -12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-1.5 sm:gap-2"
      >
        <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
          <span className="text-slate-900">词海</span>
          <span className="gradient-text-soft">寻踪</span>
        </h1>
        <p className="font-heading text-[10px] tracking-[0.3em] text-slate-500 sm:text-xs md:text-sm">
          找 到 隐 藏 词 语
        </p>
      </motion.div>

      {/* 统计胶囊：移动端 2 列网格，避免一行挤太多 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6 }}
        className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-center"
      >
        <StatChip
          icon={Target}
          color="#2563eb"
          label="今日挑战"
          value={`${todayCount} 次`}
        />
        <StatChip
          icon={Flame}
          color="#f97316"
          label="连续"
          value={`${streakDays} 天`}
        />
        <StatChip
          icon={Medal}
          color="#f59e0b"
          label="最高记录"
          value={bestRecord ? `${bestRecord} 猜` : "—"}
        />
        {showTodaySolved && (
          <StatChip
            icon={Users}
            color="#10b981"
            label="今日猜出"
            value={`${todaySolvedCount ?? 1127} 人`}
          />
        )}
      </motion.div>
    </div>
  );
}

function StatChip({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof Target;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="inline-flex items-center justify-center gap-1.5 rounded-full border bg-white/70 px-3 py-1.5 backdrop-blur-md sm:gap-2 sm:px-3.5"
      style={{ borderColor: `${color}30` }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      <span className="font-heading text-[9px] tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <span
        className="font-mono text-xs font-bold tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

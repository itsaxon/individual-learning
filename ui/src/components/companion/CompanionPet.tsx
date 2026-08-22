/**
 * WorkerFloatingWidget — 打工人助手全局浮窗
 *
 * 右下角悬浮：默认收起为圆形按钮（显示今日已赚），
 * 点击展开为小卡片，展示今日已赚 / 距下班 / 距发薪，
 * 点卡片内"查看更多"跳转完整打工人助手页面。
 *
 * 数据本地存储（localStorage），与 WorkerAssistantPage 共享同一 key。
 * 开关：右下角按钮可隐藏/显示浮窗，状态用 localStorage 持久化。
 */
import { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  Briefcase,
  CalendarDays,
  ChevronUp,
  Clock,
  Coins,
  ExternalLink,
  X,
} from "lucide-react";

const STORAGE_KEY = "worker-assistant-config";
const STORAGE_VISIBLE = "worker-floating-visible";

interface WorkerConfig {
  monthlySalary: number;
  workStart: string;
  workEnd: string;
  payday: number;
  workDaysPerMonth: number;
}

const DEFAULT_CONFIG: WorkerConfig = {
  monthlySalary: 10000,
  workStart: "09:00",
  workEnd: "18:00",
  payday: 15,
  workDaysPerMonth: 22,
};

function loadConfig(): WorkerConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function toMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function yuan(n: number): string {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function CompanionPet() {
  const [visible, setVisible] = useState(() => {
    try {
      // 默认关闭：仅当用户显式开启时才显示
      return localStorage.getItem(STORAGE_VISIBLE) === "on";
    } catch {
      return false;
    }
  });
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState<WorkerConfig>(loadConfig);
  const [now, setNow] = useState(() => Date.now());

  // 每秒刷新（驱动已赚金额 / 倒计时）
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // 监听配置变化（用户在 WorkerAssistantPage 修改后同步）
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setConfig(loadConfig());
    };
    window.addEventListener("storage", onStorage);
    // 切换 hash 回到首页等场景下重新读取一次
    const onHash = () => setConfig(loadConfig());
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VISIBLE, visible ? "on" : "off");
    } catch {
      /* ignore */
    }
  }, [visible]);

  const derived = useMemo(() => {
    const date = new Date(now);
    const startMin = toMinutes(config.workStart);
    const endMin = toMinutes(config.workEnd);
    const dayLengthMin = Math.max(1, endMin - startMin);
    const curMin =
      date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;

    const dailySalary =
      config.monthlySalary / Math.max(1, config.workDaysPerMonth);
    const perMin = dailySalary / dayLengthMin;
    let earnedToday = 0;
    let progress = 0;
    if (curMin <= startMin) {
      earnedToday = 0;
      progress = 0;
    } else if (curMin >= endMin) {
      earnedToday = dailySalary;
      progress = 1;
    } else {
      earnedToday = (curMin - startMin) * perMin;
      progress = (curMin - startMin) / dayLengthMin;
    }

    const endToday = new Date(date);
    endToday.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
    let remainSec = Math.floor((endToday.getTime() - now) / 1000);
    if (remainSec < 0) remainSec = 0;

    let payday = config.payday;
    let target = new Date(date.getFullYear(), date.getMonth(), payday);
    if (target.getTime() < startOfDay(date).getTime()) {
      target = new Date(date.getFullYear(), date.getMonth() + 1, payday);
    }
    const daysToPayday = Math.ceil(
      (startOfDay(target).getTime() - startOfDay(date).getTime()) / 86400000,
    );

    return {
      earnedToday,
      progress,
      remainSec,
      daysToPayday,
      offWork: curMin >= endMin,
      beforeWork: curMin <= startMin,
    };
  }, [now, config]);

  const remainText = useMemo(() => {
    const s = derived.remainSec;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, [derived.remainSec]);

  const gotoWorkerPage = () => {
    window.location.hash = "#/worker";
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[55] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {/* 开关按钮 */}
      <button
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "隐藏打工人浮窗" : "显示打工人浮窗"}
        title={visible ? "隐藏打工人浮窗" : "显示打工人浮窗"}
        className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-blue-300 hover:text-blue-600"
      >
        {visible ? <X className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="pointer-events-auto relative w-[280px] overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 shadow-xl backdrop-blur-xl"
          >
            {/* 收起态：圆形紧凑按钮 */}
            {!expanded ? (
              <button
                onClick={() => setExpanded(true)}
                className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-blue-50/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-white shadow-md shadow-blue-500/30">
                  <Coins className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-heading text-[10px] tracking-[0.18em] text-slate-400">
                    今日已赚
                  </div>
                  <div className="font-mono text-lg font-bold tabular-nums text-blue-600">
                    ¥ {yuan(derived.earnedToday)}
                  </div>
                </div>
                <ChevronUp className="h-5 w-5 rotate-180 text-slate-400" />
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col"
              >
                {/* 顶部：标题 + 收起 */}
                <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <span className="font-display text-sm font-bold tracking-wider text-slate-900">
                      打工人助手
                    </span>
                  </div>
                  <button
                    onClick={() => setExpanded(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    aria-label="收起"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>

                {/* 三项核心数据 */}
                <div className="flex flex-col gap-2.5 px-4 py-3.5">
                  <Row
                    icon={<Coins className="h-3.5 w-3.5" />}
                    color="#10b981"
                    label="今日已赚"
                    value={`¥ ${yuan(derived.earnedToday)}`}
                  />
                  <Row
                    icon={<Clock className="h-3.5 w-3.5" />}
                    color="#2563eb"
                    label={derived.offWork ? "已下班" : "距下班"}
                    value={
                      derived.offWork
                        ? "收工 🎉"
                        : derived.beforeWork
                        ? "未开工"
                        : remainText
                    }
                  />
                  <Row
                    icon={<CalendarDays className="h-3.5 w-3.5" />}
                    color="#f59e0b"
                    label="距发薪"
                    value={`${derived.daysToPayday} 天`}
                  />
                </div>

                {/* 进度条 */}
                <div className="px-4 pb-3.5">
                  <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span>打工进度</span>
                    <span className="tabular-nums text-blue-600">
                      {(derived.progress * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-slate-200/70">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-sky-400"
                      animate={{ width: `${derived.progress * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* 跳转完整页面 */}
                <button
                  onClick={gotoWorkerPage}
                  className="flex items-center justify-center gap-1.5 border-t border-slate-200/70 bg-blue-50/40 px-4 py-3 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  <span>查看完整面板</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-6 w-6 items-center justify-center rounded-md"
        style={{ background: `${color}18`, color }}
      >
        {icon}
      </div>
      <span className="font-heading text-[10px] tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <span className="ml-auto font-mono text-sm font-bold tabular-nums text-slate-900">
        {value}
      </span>
    </div>
  );
}

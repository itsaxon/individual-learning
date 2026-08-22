/**
 * 打工人助手 — 工作日实时记账与下班倒计时
 *
 * 功能：
 *   1. 今日已赚：按月薪 / 月工作日 / 每日工作时长 实时累计（每秒刷新）
 *   2. 距下班：当前时间到下班时间的倒计时
 *   3. 距发薪：到下一个发薪日的天数
 *   4. 今日进度条：上班 → 下班的完成百分比
 *   5. 配置：月薪 / 上班时间 / 下班时间 / 每月发薪日 / 月工作日，全部本地存储
 *
 * 数据：localStorage（key: worker-assistant-config），不依赖任何后端
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Clock,
  Coins,
  Settings,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "worker-assistant-config";

interface WorkerConfig {
  /** 月薪（税前，元） */
  monthlySalary: number;
  /** 每天上班时间 HH:MM */
  workStart: string;
  /** 每天下班时间 HH:MM */
  workEnd: string;
  /** 每月发薪日（1-31） */
  payday: number;
  /** 月工作日（默认 22） */
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

function saveConfig(c: WorkerConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

/** 把 HH:MM 转成当日分钟数 */
function toMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** 格式化数字为人民币 */
function yuan(n: number): string {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function WorkerAssistantPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<WorkerConfig>(loadConfig);
  const [editing, setEditing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // 每秒刷新（驱动倒计时与已赚金额）
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const derived = useMemo(() => {
    const date = new Date(now);
    const startMin = toMinutes(config.workStart);
    const endMin = toMinutes(config.workEnd);
    const dayLengthMin = Math.max(1, endMin - startMin);
    const curMin = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;

    // 今日已赚：仅在上班时段累计，下班后锁定为全天，上班前为 0
    const dailySalary = config.monthlySalary / Math.max(1, config.workDaysPerMonth);
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

    // 距下班剩余秒数
    const endToday = new Date(date);
    endToday.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
    let remainSec = Math.floor((endToday.getTime() - now) / 1000);
    if (remainSec < 0) remainSec = 0;

    // 距发薪天数：若本月发薪日已过，算下月
    let payday = config.payday;
    let target = new Date(date.getFullYear(), date.getMonth(), payday);
    if (target.getTime() < startOfDay(date).getTime()) {
      target = new Date(date.getFullYear(), date.getMonth() + 1, payday);
    }
    const daysToPayday = Math.ceil(
      (startOfDay(target).getTime() - startOfDay(date).getTime()) / 86400000,
    );

    // 秒薪（每秒赚多少）
    const perSec = (config.monthlySalary / Math.max(1, config.workDaysPerMonth)) / dayLengthMin / 60;

    return {
      earnedToday,
      progress,
      remainSec,
      daysToPayday,
      dailySalary,
      perSec,
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

  const handleSave = (c: WorkerConfig) => {
    setConfig(c);
    saveConfig(c);
    setEditing(false);
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* 背景：浅蓝径向光晕，与全站一致 */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-blue-200/40 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[460px] rounded-full bg-sky-200/30 blur-[100px]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-3 pt-6 sm:px-6 sm:pt-12 lg:px-8">
        {/* 返回按钮：浮在左上角，与词海寻踪对齐 */}
        <button
          onClick={() => {
            navigate("/");
          }}
          className="absolute left-0 top-0 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] text-slate-600 backdrop-blur-md transition-colors hover:border-blue-300 hover:text-blue-600 sm:left-4 sm:top-0 sm:px-3.5 sm:py-2 sm:text-xs lg:left-6 lg:text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          摸鱼舱
        </button>

        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
              <Briefcase className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-heading text-[10px] font-bold tracking-[0.25em] text-blue-600">
                WORKER
              </span>
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
              打工人<span className="gradient-text-soft">助手</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500 md:text-base">
              实时记账、下班倒计时、发薪倒数，陪你熬过每一个工作日。
            </p>
          </div>

          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-600 backdrop-blur-md transition-colors hover:border-blue-300 hover:text-blue-600"
          >
            <Settings className="h-4 w-4" />
            设置
          </button>
        </div>

        {/* 主数据卡 */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* 今日已赚 */}
          <StatCard
            icon={<Coins className="h-5 w-5" />}
            color="#10b981"
            label="今日已赚"
            value={`¥ ${yuan(derived.earnedToday)}`}
            sub={`日均 ¥ ${yuan(derived.dailySalary)} · 每秒 +¥${derived.perSec.toFixed(3)}`}
            highlight
          />

          {/* 距下班 */}
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            color="#2563eb"
            label={derived.offWork ? "已下班" : "距下班"}
            value={derived.offWork ? "收工 🎉" : derived.beforeWork ? "未开工" : remainText}
            sub={`${config.workStart} → ${config.workEnd}`}
          />

          {/* 距发薪 */}
          <StatCard
            icon={<CalendarDays className="h-5 w-5" />}
            color="#f59e0b"
            label="距发薪"
            value={`${derived.daysToPayday} 天`}
            sub={`每月 ${config.payday} 号发薪`}
          />
        </div>

        {/* 今日进度条 */}
        <div className="mt-6 rounded-3xl border border-slate-200/70 bg-white/70 p-7 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wallet className="h-5 w-5 text-blue-600" />
              <span className="font-display text-base font-bold text-slate-900">
                今日打工进度
              </span>
            </div>
            <span className="font-mono text-base font-bold tabular-nums text-blue-600">
              {(derived.progress * 100).toFixed(1)}%
            </span>
          </div>
          <div className="relative h-4 overflow-hidden rounded-full bg-slate-200/70">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-sky-400"
              animate={{ width: `${derived.progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="mt-2.5 flex justify-between font-mono text-xs text-slate-400">
            <span>{config.workStart} 上班</span>
            <span>{config.workEnd} 下班</span>
          </div>
        </div>

        {/* 当前配置概览 */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat label="月薪" value={`¥ ${yuan(config.monthlySalary)}`} />
          <MiniStat label="月工作日" value={`${config.workDaysPerMonth} 天`} />
          <MiniStat label="日薪" value={`¥ ${yuan(derived.dailySalary)}`} />
          <MiniStat label="发薪日" value={`每月 ${config.payday} 号`} />
        </div>
      </div>

      {/* 设置弹窗 */}
      {editing && (
        <ConfigModal
          config={config}
          onCancel={() => setEditing(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  color,
  label,
  value,
  sub,
  highlight = false,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-7 backdrop-blur-xl"
    >
      {highlight && (
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-2xl"
          style={{ background: `${color}30` }}
        />
      )}
      <div className="relative">
        <div className="mb-4 flex items-center gap-2.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: `${color}18`, color }}
          >
            {icon}
          </div>
          <span className="font-heading text-xs tracking-[0.2em] text-slate-500">
            {label}
          </span>
        </div>
        <div
          className="font-display text-4xl font-black tabular-nums text-slate-900 md:text-5xl"
          style={{ color: highlight ? color : undefined }}
        >
          {value}
        </div>
        <div className="mt-3 font-mono text-xs text-slate-400">{sub}</div>
      </div>
    </motion.div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/60 px-5 py-4 backdrop-blur-md">
      <div className="font-heading text-[10px] tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-base font-bold tabular-nums text-slate-900">
        {value}
      </div>
    </div>
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function ConfigModal({
  config,
  onCancel,
  onSave,
}: {
  config: WorkerConfig;
  onCancel: () => void;
  onSave: (c: WorkerConfig) => void;
}) {
  const [form, setForm] = useState<WorkerConfig>(config);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl"
      >
        <h3 className="mb-1 font-display text-lg font-bold text-slate-900">
          打工参数设置
        </h3>
        <p className="mb-5 text-xs text-slate-500">
          数据仅保存在本机浏览器，不会上传。
        </p>

        <div className="flex flex-col gap-4">
          <Field label="月薪（元）">
            <input
              type="number"
              min={0}
              value={form.monthlySalary}
              onChange={(e) =>
                setForm({ ...form, monthlySalary: Number(e.target.value) })
              }
              className="w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="上班时间">
              <input
                type="time"
                value={form.workStart}
                onChange={(e) => setForm({ ...form, workStart: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </Field>
            <Field label="下班时间">
              <input
                type="time"
                value={form.workEnd}
                onChange={(e) => setForm({ ...form, workEnd: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="每月发薪日">
              <input
                type="number"
                min={1}
                max={31}
                value={form.payday}
                onChange={(e) =>
                  setForm({ ...form, payday: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </Field>
            <Field label="月工作日">
              <input
                type="number"
                min={1}
                max={31}
                value={form.workDaysPerMonth}
                onChange={(e) =>
                  setForm({ ...form, workDaysPerMonth: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            取消
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-heading text-[10px] tracking-[0.18em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

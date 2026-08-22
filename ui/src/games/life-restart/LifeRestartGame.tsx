/**
 * lifeRestart 人生重开模拟器 — React 原生 UI
 *
 * 完全基于 lifeRestart 的逻辑层（Life 类），用 React 重写 UI。
 * 游戏流程：主界面 → 天赋抽卡 → 属性分配 → 人生经历 → 人生总结 → 再次重开
 *
 * 主题：白色亮色（与 LifeRestartPage 一致），金色作为强调色
 * 字体：标准中文字体栈
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, RotateCcw, Sparkles, Zap } from "lucide-react";
import { core, i18n, readyPromise } from "./engine";

// ---- 类型 ----
type Phase = "loading" | "main" | "talent" | "property" | "play" | "summary";
type TalentInfo = { id: number; grade: number; name: string; description: string };
type ContentItem = {
  type: string;
  name?: string;
  grade?: number;
  description?: string;
  postEvent?: string;
  source?: TalentInfo;
  target?: TalentInfo;
};
type AgeResult = { age: number; content: ContentItem[]; isEnd: boolean };

// ---- 常量 ----
// 亮色主题下的品质配色：文字色 / 背景色（边框 + 浅底）
const GRADE_COLORS = ["text-slate-600", "text-sky-600", "text-violet-600", "text-blue-600"];
const GRADE_BG = [
  "border-slate-200 bg-slate-50",
  "border-sky-200 bg-sky-50",
  "border-violet-200 bg-violet-50",
  "border-blue-200 bg-blue-50",
];
const PROP_LABELS: Record<string, string> = {
  CHR: "颜值", INT: "智力", STR: "体质", MNY: "家境", SPR: "快乐",
};
const PROP_KEYS = ["CHR", "INT", "STR", "MNY", "SPR"] as const;

const T = i18n as Record<string, string>;

export default function LifeRestartGame() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    readyPromise.then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) setPhase("main");
  }, [ready]);

  if (phase === "loading" || !ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
        <p className="text-sm tracking-[0.2em] text-slate-500">
          正在加载人生重开…
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain" data-lenis-prevent>
      <AnimatePresence mode="wait">
        {phase === "main" && <MainScreen key="main" onPlay={() => setPhase("talent")} />}
        {phase === "talent" && (
          <TalentScreen key="talent" onDone={() => setPhase("property")} onBack={() => setPhase("main")} />
        )}
        {phase === "property" && (
          <PropertyScreen key="property" onStart={() => setPhase("play")} onBack={() => setPhase("talent")} />
        )}
        {phase === "play" && <PlayScreen key="play" onEnd={() => setPhase("summary")} />}
        {phase === "summary" && <SummaryScreen key="summary" onRemake={() => setPhase("main")} />}
      </AnimatePresence>
    </div>
  );
}

/* ============ 主界面 ============ */
function MainScreen({ onPlay }: { onPlay: () => void }) {
  const times = core.times;
  const [achievedCount, setAchievedCount] = useState(0);

  useEffect(() => {
    try {
      const list = core.achievements;
      setAchievedCount(list.filter((a: any) => a.isAchieved).length);
    } catch {}
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex min-h-full flex-col items-center justify-center gap-8 p-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          {T.UI_Title_Remake}
        </h2>
        <p className="mt-3 text-sm tracking-[0.2em] text-slate-500">
          {T.UI_Title_Subsequent}
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={onPlay}
        className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-500 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-sky-600 hover:shadow-blue-500/40"
      >
        <RotateCcw className="h-5 w-5" />
        {T.UI_Remake}
      </motion.button>

      <div className="flex gap-8 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold tabular-nums text-slate-900">
            {times}
          </span>
          <span className="text-xs tracking-wider text-slate-500">
            {T.UI_Remake_Times}
          </span>
        </div>
        <div className="w-px bg-slate-200" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold tabular-nums text-slate-900">
            {achievedCount}
          </span>
          <span className="text-xs tracking-wider text-slate-500">
            {T.UI_Achievement_Count}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ============ 天赋抽卡 ============ */
function TalentScreen({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [talents, setTalents] = useState<TalentInfo[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [replacements, setReplacements] = useState<any[]>([]);
  const [error, setError] = useState("");

  const draw = useCallback(() => {
    const drawn = core.talentRandom() as TalentInfo[];
    setTalents(drawn);
    setSelected([]);
    setReplacements([]);
    setError("");
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  const limit = core.talentSelectLimit;

  const toggle = (id: number) => {
    setError("");
    if (selected.includes(id)) {
      setSelected(selected.filter((t) => t !== id));
      return;
    }
    if (selected.length >= limit) {
      setError(T.F_TalentSelectLimit.replace("{0}", String(limit)));
      return;
    }
    // 检查冲突
    for (const sid of selected) {
      const conflict = core.exclude([...selected, id], sid);
      if (conflict) {
        setError(T.F_TalentConflict.replace("{0}", getTalentName(conflict)));
        return;
      }
    }
    setSelected([...selected, id]);
  };

  const getTalentName = (id: number) => {
    try {
      return core.request(core.Module.TALENT).get(id).name;
    } catch {
      return "?";
    }
  };

  const confirm = () => {
    if (selected.length < limit) {
      setError(T.F_TalentSelectNotComplect.replace("{0}", String(limit)));
      return;
    }
    const contents = core.remake(selected);
    setReplacements(contents);
    setTimeout(onDone, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex min-h-full flex-col gap-4 p-5 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-500 transition-colors hover:text-slate-800">
          ← 返回
        </button>
        <h2 className="text-xl font-bold text-slate-900">
          {T.UI_Title_Talent}
        </h2>
        <button onClick={draw} className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
          {T.UI_Talent_Draw}
        </button>
      </div>

      <p className="text-center text-sm tracking-wider text-slate-500">
        {T.UI_Talent_Select_Uncomplete}（已选 {selected.length}/{limit}）
      </p>

      {/* 天赋列表 */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
        {talents.map((t) => {
          const isSel = selected.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className={`relative rounded-xl border p-3.5 text-left transition-all ${
                isSel
                  ? GRADE_BG[t.grade] + " ring-2 ring-blue-400/50"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {isSel && (
                <span className="absolute right-2 top-2 text-blue-600">✓</span>
              )}
              <span className={`text-xs font-bold ${GRADE_COLORS[t.grade]}`}>
                {["普通", "稀有", "珍贵", "传说"][t.grade] || "普通"}
              </span>
              <p className="mt-1 text-base font-bold text-slate-900">{t.name}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {t.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* 天赋替换提示 */}
      <AnimatePresence>
        {replacements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-1.5"
          >
            {replacements.map((r, i) => (
              <div
                key={i}
                className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700"
              >
                {T.F_TalentReplace.replace("{source.name}", r.source.name).replace(
                  "{target.name}",
                  r.target.name,
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-center text-sm text-rose-600">{error}</p>
      )}

      <button
        onClick={confirm}
        disabled={selected.length < limit}
        className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-sky-600 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
      >
        <Sparkles className="h-4 w-4" />
        {T.UI_Make_New_Life}
        <ChevronRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

/* ============ 属性分配 ============ */
function PropertyScreen({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const totalPoints = core.getPropertyPoints();
  const [min, max] = core.propertyAllocateLimit as [number, number];
  const [props, setProps] = useState<Record<string, number>>({
    CHR: 0, INT: 0, STR: 0, MNY: 0, SPR: 5, // SPR 默认 5
  });
  const [error, setError] = useState("");

  const allocated = PROP_KEYS.reduce((s, k) => s + props[k], 0);
  const remaining = totalPoints - allocated;

  const adjust = (key: string, delta: number) => {
    setError("");
    const newVal = props[key] + delta;
    if (newVal < min) return;
    if (newVal > max) return;
    if (delta > 0 && remaining <= 0) return;
    setProps({ ...props, [key]: newVal });
  };

  const randomAlloc = () => {
    setError("");
    const newProps = { ...props };
    let pts = totalPoints;
    // 随机分配
    let keys = [...PROP_KEYS];
    while (pts > 0 && keys.length > 0) {
      const k = keys[Math.floor(Math.random() * keys.length)];
      if (newProps[k] < max) {
        newProps[k]++;
        pts--;
      } else {
        keys = keys.filter((x) => x !== k);
      }
    }
    setProps(newProps);
  };

  const confirm = () => {
    if (remaining > 0) {
      setError(T.F_PropertyPointLeft.replace("{0}", String(remaining)));
      return;
    }
    core.start(props);
    onStart();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex min-h-full flex-col gap-4 p-5 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-500 transition-colors hover:text-slate-800">
          ← 返回
        </button>
        <h2 className="text-xl font-bold text-slate-900">
          {T.UI_Title_Property}
        </h2>
        <div className="w-12" />
      </div>

      {/* 剩余点数 */}
      <div className="flex items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <span className="text-sm tracking-wider text-slate-600">
          {T.UI_Left_Property_Point}
        </span>
        <span className="text-2xl font-bold tabular-nums text-blue-700">
          {remaining}
        </span>
      </div>

      {/* 属性滑块 */}
      <div className="space-y-3.5">
        {PROP_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-14 text-base font-medium text-slate-800">
              {PROP_LABELS[key]}
            </span>
            <button
              onClick={() => adjust(key, -1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-700"
            >
              −
            </button>
            <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 transition-all"
                style={{ width: `${(props[key] / max) * 100}%` }}
              />
            </div>
            <span className="w-10 text-center text-lg font-bold tabular-nums text-slate-900">
              {props[key]}
            </span>
            <button
              onClick={() => adjust(key, 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-700"
            >
              +
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={randomAlloc}
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-700"
      >
        <Zap className="h-4 w-4" />
        {T.UI_Random_Allocate}
      </button>

      {error && <p className="text-center text-sm text-rose-600">{error}</p>}

      <button
        onClick={confirm}
        className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-sky-600"
      >
        {T.UI_Make_New_Life}
        <ChevronRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

/* ============ 人生经历 ============ */
function PlayScreen({ onEnd }: { onEnd: () => void }) {
  const [logs, setLogs] = useState<{ age: number; items: ContentItem[] }[]>([]);
  const [currentAge, setCurrentAge] = useState(0);
  const [isEnd, setIsEnd] = useState(false);
  const [auto, setAuto] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const nextStep = useCallback(() => {
    const result: AgeResult = core.next();
    setCurrentAge(result.age);
    setLogs((prev) => [...prev, { age: result.age, items: result.content }]);
    if (result.isEnd) {
      setIsEnd(true);
      setAuto(false);
    }
    return result;
  }, []);

  useEffect(() => {
    // 第一步
    nextStep();
  }, [nextStep]);

  // 自动模式
  useEffect(() => {
    if (!auto || isEnd) return;
    const id = setTimeout(() => {
      const r = nextStep();
      if (r.isEnd) setAuto(false);
    }, 600);
    return () => clearTimeout(id);
  }, [auto, isEnd, logs, nextStep]);

  // 死亡后自动跳转到总结界面（给用户 1.5 秒看到最后一条日志）
  useEffect(() => {
    if (!isEnd) return;
    const id = setTimeout(() => onEnd(), 1500);
    return () => clearTimeout(id);
  }, [isEnd, onEnd]);

  // 滚动到底部
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const currentProps = core.propertys;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col"
    >
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/60 px-5 py-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-base font-bold text-blue-700">
            {currentAge} 岁
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-700">
            颜{currentProps.CHR} 智{currentProps.INT} 体{currentProps.STR} 钱{currentProps.MNY} 乐{currentProps.SPR}
          </span>
        </div>
        <button
          onClick={() => setAuto((a) => !a)}
          disabled={isEnd}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            auto
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-600 hover:text-slate-900"
          } disabled:opacity-40`}
        >
          {auto ? T.UI_Auto : T.UI_Manual}
        </button>
      </div>

      {/* 日志 */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-3.5">
          {logs.map((entry, i) => (
            <div key={i}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-base font-bold text-blue-700">
                  {entry.age} 岁
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              {entry.items.map((item, j) => (
                <ContentRow key={j} item={item} />
              ))}
            </div>
          ))}
        </div>
        <div ref={logEndRef} />
      </div>

      {/* 底部操作 */}
      <div className="border-t border-slate-200 bg-white/60 p-4">
        {isEnd ? (
          <button
            onClick={onEnd}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-sky-600"
          >
            {T.UI_Goto_Summary}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => nextStep()}
            disabled={auto}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-sky-600 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            {T.UI_Next}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ContentRow({ item }: { item: ContentItem }) {
  if (item.type === "talentReplace") {
    return (
      <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700">
        天赋替换：{item.source?.name} → {item.target?.name}
      </div>
    );
  }
  const grade = item.grade ?? 0;
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm leading-relaxed ${GRADE_BG[grade] || GRADE_BG[0]}`}>
      {item.type === "TLT" && (
        <span className={`mr-1 font-bold ${GRADE_COLORS[grade]}`}>【{item.name}】</span>
      )}
      <span className="text-slate-800">{item.description}</span>
      {item.postEvent && (
        <p className="mt-0.5 text-slate-500">{item.postEvent}</p>
      )}
    </div>
  );
}

/* ============ 人生总结 ============ */
function SummaryScreen({ onRemake }: { onRemake: () => void }) {
  const [summary, setSummary] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [achievements, setAchievements] = useState<any[]>([]);
  const [extendTalent, setExtendTalent] = useState<number | null>(null);

  useEffect(() => {
    try {
      const s = core.summary;
      setSummary(s);
      setStats(core.statistics);
      setAchievements(core.achievements);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const pt = core.PropertyTypes;
  const judgeLabels: Record<string, { label: string; value: number; judge?: string }>[] = [
    { prop: pt.HAGE, label: T.UI_Final_Age },
    { prop: pt.HCHR, label: PROP_LABELS.CHR },
    { prop: pt.HINT, label: PROP_LABELS.INT },
    { prop: pt.HSTR, label: PROP_LABELS.STR },
    { prop: pt.HMNY, label: PROP_LABELS.MNY },
    { prop: pt.HSPR, label: PROP_LABELS.SPR },
  ] as any;

  const sumJudge = summary[pt.SUM];

  const handleRemake = () => {
    if (extendTalent) {
      core.talentExtend(extendTalent);
    }
    core.times = core.times + 1;
    onRemake();
  };

  const achievedList = achievements.filter((a) => a.isAchieved);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex min-h-full flex-col gap-4 p-5 sm:p-6"
    >
      <h2 className="text-center text-2xl font-bold text-slate-900">
        {T.UI_Title_Summary}
      </h2>

      {/* 总评 */}
      {sumJudge && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white px-6 py-5">
          <span className="text-sm tracking-[0.2em] text-slate-600">
            {T.UI_Total_Judge}
          </span>
          <span className="text-4xl font-black tabular-nums text-blue-700">
            {sumJudge.value}
          </span>
          <span className={`text-base font-bold ${GRADE_COLORS[sumJudge.grade] || "text-slate-700"}`}>
            {sumJudge.judge ? T[sumJudge.judge] || sumJudge.judge : ""}
          </span>
        </div>
      )}

      {/* 属性评价 */}
      <div className="grid grid-cols-2 gap-2.5">
        {judgeLabels.map((j: any) => {
          const data = summary[j.prop];
          if (!data) return null;
          return (
            <div
              key={j.prop}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5"
            >
              <span className="text-sm text-slate-600">{j.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tabular-nums text-slate-900">
                  {data.value}
                </span>
                {data.judge && (
                  <span className={`text-xs ${GRADE_COLORS[data.grade] || ""}`}>
                    {T[data.judge] || ""}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label={T.UI_Remake_Times} value={stats[pt.TMS]?.value ?? 0} />
        <StatCard label={T.UI_Achievement_Count} value={stats[pt.CACHV]?.value ?? 0} />
        <StatCard
          label={T.UI_Talent_Collection_Rate}
          value={`${Math.round((stats[pt.RTLT]?.value ?? 0) * 100)}%`}
        />
      </div>

      {/* 成就列表 */}
      {achievedList.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm tracking-[0.2em] text-slate-500">
            {T.UI_Achievement_Achieve}（{achievedList.length}）
          </h3>
          {achievedList.slice(-5).map((a) => (
            <div
              key={a.id}
              className={`rounded-lg border px-3 py-2 ${GRADE_BG[a.grade] || GRADE_BG[0]}`}
            >
              <span className={`mr-1.5 text-sm font-bold ${GRADE_COLORS[a.grade]}`}>
                {a.name}
              </span>
              <span className="text-xs text-slate-600">{a.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* 天赋继承 */}
      <div className="space-y-2">
        <h3 className="text-sm tracking-[0.2em] text-slate-500">
          {T.UI_Talent_Extend}
        </h3>
        <div className="flex flex-wrap gap-2">
          {core.propertys.TLT?.map((id: number) => {
            try {
              const t = core.request(core.Module.TALENT).get(id);
              const isSel = extendTalent === id;
              return (
                <button
                  key={id}
                  onClick={() => setExtendTalent(isSel ? null : id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                    isSel
                      ? GRADE_BG[t.grade] + " ring-2 ring-blue-400/50"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
                  }`}
                >
                  {t.name}
                </button>
              );
            } catch {
              return null;
            }
          })}
        </div>
      </div>

      <button
        onClick={handleRemake}
        className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-sky-600"
      >
        <RotateCcw className="h-4 w-4" />
        {T.UI_Remake_Again}
      </button>
    </motion.div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white py-3">
      <span className="text-lg font-bold tabular-nums text-slate-900">
        {value}
      </span>
      <span className="text-center text-xs tracking-wider text-slate-500">
        {label}
      </span>
    </div>
  );
}

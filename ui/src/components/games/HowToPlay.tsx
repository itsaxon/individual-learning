/**
 * HowToPlay — 玩法说明（亮色版，灯泡 + 可折叠）
 * 放在游戏页最底部，默认折叠，点击展开
 */
import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { simTier } from "./SimilarityBar";

const TIERS = [
  { range: "99-100%", ...simTier(100), desc: "命中目标词" },
  { range: "70-98%", ...simTier(75), desc: "非常接近" },
  { range: "35-69%", ...simTier(50), desc: "方向相关" },
  { range: "10-34%", ...simTier(20), desc: "略有联系" },
  { range: "0-9%", ...simTier(0), desc: "几无关联" },
];

const STEPS = [
  {
    n: "01",
    title: "输入词语",
    desc: "在输入框输入任意中文词语，按回车或点发送提交。",
  },
  {
    n: "02",
    title: "查看相关度",
    desc: "系统计算你的词与目标词的语义相似度，0-100% 越高越接近。",
  },
  {
    n: "03",
    title: "根据反馈调整",
    desc: "颜色由蓝转紫再转绿，相关度越高越接近答案。最佳猜测置顶。",
  },
  {
    n: "04",
    title: "猜中获胜",
    desc: "相关度达到 99% 以上即视为猜中，记录会自动保存到回溯。",
  },
];

export default function HowToPlay() {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <Lightbulb className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-sm font-bold text-slate-900">
            怎么玩
          </h3>
          <p className="text-[11px] text-slate-500">
            输入词语，根据相关度逼近答案
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-slate-200 px-5 py-5">
          {/* 步骤 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="mb-1 font-mono text-xs font-bold text-blue-600">
                  {s.n}
                </div>
                <h4 className="font-display text-xs font-bold text-slate-900">
                  {s.title}
                </h4>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* 颜色分级 */}
          <div className="mt-5">
            <div className="mb-2 font-heading text-[10px] tracking-[0.25em] text-slate-400">
              颜色含义
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
              {TIERS.map((t) => (
                <div
                  key={t.range}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5"
                  style={{ borderLeft: `2px solid ${t.color}` }}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: t.color }}
                  />
                  <span
                    className="font-mono text-[10px] font-bold tabular-nums"
                    style={{ color: t.color }}
                  >
                    {t.range}
                  </span>
                  <span className="text-[10px] text-slate-600">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 提示 */}
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <div className="flex-1 text-[11px] leading-relaxed text-slate-700">
                <span className="font-bold text-amber-700">小贴士：</span>
                从宽泛的类别词（如「动物」「食物」）开始试起，
                根据相关度方向逐步收窄，比直接猜具体词更高效。
                历史记录自动保存，可在「回溯」中回看推理过程。
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

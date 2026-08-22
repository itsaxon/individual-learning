/**
 * lifeRestart 游戏引擎封装
 *
 * 把 lifeRestart 的纯 JS 逻辑层（modules + functions）接入 React 项目。
 * - 提供 $$event / $$on / $$off / $$copy / $$read 全局事件系统（原 LayaAir UI 层依赖）
 * - 用 JSON import 替代 Laya Loader 加载数据
 * - 创建并配置 Life 实例，导出单例
 */
import Life from "./logic/life.js";
import i18n from "./logic/i18n.js";

// 数据文件（Vite 原生支持 JSON import）
import age from "./data/age.json";
import talents from "./data/talents.json";
import events from "./data/events.json";
import achievements from "./data/achievement.json";
import characters from "./data/character.json";
import specialthanks from "./data/specialthanks.json";

// ---- 全局事件系统（原 index.js 中的 $$event / $$on / $$off） ----
const $$eventMap = new Map<string, Set<(data: any) => void>>();

function ensureInit() {
  if (typeof (globalThis as any).$$event === "function") return;
  (globalThis as any).$$eventMap = $$eventMap;
  (globalThis as any).$$event = (tag: string, data: any) => {
    const listener = $$eventMap.get(tag);
    if (listener) listener.forEach((fn) => fn(data));
  };
  (globalThis as any).$$on = (tag: string, fn: (data: any) => void) => {
    let listener = $$eventMap.get(tag);
    if (!listener) {
      listener = new Set();
      $$eventMap.set(tag, listener);
    }
    listener.add(fn);
  };
  (globalThis as any).$$off = (tag: string, fn: (data: any) => void) => {
    const listener = $$eventMap.get(tag);
    if (listener) listener.delete(fn);
  };
  (globalThis as any).$$copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };
  (globalThis as any).$$read = async () => {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return "";
    }
  };
}

ensureInit();

// ---- 创建并初始化 Life 实例 ----
const core = new Life();

/** 数据加载器（替代 Laya Loader） */
const i18nLoad = async (name: string) => {
  const map: Record<string, any> = { age, talents, events, achievement: achievements, character: characters };
  return map[name];
};
const commonLoad = async (name: string) => {
  const map: Record<string, any> = { specialthanks };
  return map[name];
};

/** 初始化 + 配置（与原 index.js 完全一致） */
const readyPromise = (async () => {
  await core.initial(i18nLoad, commonLoad);
  core.config({
    defaultPropertyPoints: 20,
    talentSelectLimit: 3,
    propertyAllocateLimit: [0, 10],
    defaultPropertys: { SPR: 5 },
    talentConfig: {
      talentPullCount: 10,
      talentRate: { 1: 100, 2: 10, 3: 1, total: 1000 },
      additions: {
        TMS: [
          [10, { 2: 1 }],
          [30, { 2: 2 }],
          [50, { 2: 3 }],
          [70, { 2: 4 }],
          [100, { 2: 5 }],
        ],
        CACHV: [
          [10, { 2: 1 }],
          [30, { 2: 2 }],
          [50, { 2: 3 }],
          [70, { 2: 4 }],
          [100, { 2: 5 }],
        ],
      },
    },
    propertyConfig: {
      judge: {
        RTLT: [[0, 0], [0.3, 1], [0.6, 2], [0.9, 3]],
        REVT: [[0, 0], [0.2, 1], [0.4, 2], [0.6, 3]],
        TMS: [
          [0, 0, "UI_Remake_Times_Judge_Level_0"],
          [10, 1, "UI_Remake_Times_Judge_Level_1"],
          [30, 1, "UI_Remake_Times_Judge_Level_2"],
          [50, 2, "UI_Remake_Times_Judge_Level_3"],
          [70, 2, "UI_Remake_Times_Judge_Level_4"],
          [100, 3, "UI_Remake_Times_Judge_Level_5"],
        ],
        CACHV: [
          [0, 0, "UI_Achievement_Count_Judge_Level_0"],
          [10, 1, "UI_Achievement_Count_Judge_Level_1"],
          [30, 1, "UI_Achievement_Count_Judge_Level_2"],
          [50, 2, "UI_Achievement_Count_Judge_Level_3"],
          [70, 2, "UI_Achievement_Count_Judge_Level_4"],
          [100, 3, "UI_Achievement_Count_Judge_Level_5"],
        ],
        HCHR: [
          [0, 0, "UI_Judge_Level_0"],
          [1, 0, "UI_Judge_Level_1"],
          [2, 0, "UI_Judge_Level_2"],
          [4, 0, "UI_Judge_Level_3"],
          [7, 1, "UI_Judge_Level_4"],
          [9, 2, "UI_Judge_Level_5"],
          [11, 3, "UI_Judge_Level_6"],
        ],
        HMNY: [
          [0, 0, "UI_Judge_Level_0"],
          [1, 0, "UI_Judge_Level_1"],
          [2, 0, "UI_Judge_Level_2"],
          [4, 0, "UI_Judge_Level_3"],
          [7, 1, "UI_Judge_Level_4"],
          [9, 2, "UI_Judge_Level_5"],
          [11, 3, "UI_Judge_Level_6"],
        ],
        HSPR: [
          [0, 0, "UI_Spirit_Judge_Level_0"],
          [1, 0, "UI_Spirit_Judge_Level_1"],
          [2, 0, "UI_Spirit_Judge_Level_2"],
          [4, 0, "UI_Spirit_Judge_Level_3"],
          [7, 1, "UI_Spirit_Judge_Level_4"],
          [9, 2, "UI_Spirit_Judge_Level_5"],
          [11, 3, "UI_Spirit_Judge_Level_6"],
        ],
        HINT: [
          [0, 0, "UI_Judge_Level_0"],
          [1, 0, "UI_Judge_Level_1"],
          [2, 0, "UI_Judge_Level_2"],
          [4, 0, "UI_Judge_Level_3"],
          [7, 1, "UI_Judge_Level_4"],
          [9, 2, "UI_Judge_Level_5"],
          [11, 3, "UI_Judge_Level_6"],
          [21, 3, "UI_Intelligence_Judge_Level_7"],
          [131, 3, "UI_Intelligence_Judge_Level_8"],
          [501, 3, "UI_Intelligence_Judge_Level_9"],
        ],
        HSTR: [
          [0, 0, "UI_Judge_Level_0"],
          [1, 0, "UI_Judge_Level_1"],
          [2, 0, "UI_Judge_Level_2"],
          [4, 0, "UI_Judge_Level_3"],
          [7, 1, "UI_Judge_Level_4"],
          [9, 2, "UI_Judge_Level_5"],
          [11, 3, "UI_Judge_Level_6"],
          [21, 3, "UI_Strength_Judge_Level_7"],
          [101, 3, "UI_Strength_Judge_Level_8"],
          [401, 3, "UI_Strength_Judge_Level_9"],
          [1001, 3, "UI_Strength_Judge_Level_10"],
          [2001, 3, "UI_Strength_Judge_Level_11"],
        ],
        HAGE: [
          [0, 0, "UI_AGE_Judge_Level_0"],
          [1, 0, "UI_AGE_Judge_Level_1"],
          [10, 0, "UI_AGE_Judge_Level_2"],
          [18, 0, "UI_AGE_Judge_Level_3"],
          [40, 0, "UI_AGE_Judge_Level_4"],
          [60, 1, "UI_AGE_Judge_Level_5"],
          [70, 1, "UI_AGE_Judge_Level_6"],
          [80, 2, "UI_AGE_Judge_Level_7"],
          [90, 2, "UI_AGE_Judge_Level_8"],
          [95, 3, "UI_AGE_Judge_Level_9"],
          [100, 3, "UI_AGE_Judge_Level_10"],
          [500, 3, "UI_AGE_Judge_Level_11"],
        ],
        SUM: [
          [0, 0, "UI_Judge_Level_0"],
          [41, 0, "UI_Judge_Level_1"],
          [50, 0, "UI_Judge_Level_2"],
          [60, 0, "UI_Judge_Level_3"],
          [80, 1, "UI_Judge_Level_4"],
          [100, 2, "UI_Judge_Level_5"],
          [110, 3, "UI_Judge_Level_6"],
          [120, 3, "UI_Judge_Level_7"],
        ],
      },
    },
    characterConfig: {
      characterPullCount: 3,
      rateableKnife: 10,
      propertyWeight: [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
        [5, 6], [6, 5], [7, 4], [8, 3], [9, 2], [10, 1],
      ],
      talentWeight: [
        [1, 1], [2, 2], [3, 3], [4, 2], [5, 1],
      ],
    },
  } as any);
})();

export { core, i18n, readyPromise };

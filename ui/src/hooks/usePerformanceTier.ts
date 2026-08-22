/**
 * usePerformanceTier — GPU 性能等级检测
 *
 * 返回 0 / 1 / 2 三档：
 *   0 — 低端（移动端 / 内存 ≤ 4GB / CPU ≤ 4 核）：禁用 WebGL，使用 Canvas 降级背景
 *   1 — 中端：启用 WebGL + 基础后期，粒子减半，关闭 DOF / SSR
 *   2 — 高端：全部启用
 */
import { useEffect, useState } from "react";

export type PerfTier = 0 | 1 | 2;

export interface PerfConfig {
  tier: PerfTier;
  /** 是否启用 WebGL 主场景 */
  webgl: boolean;
  /** 粒子数量 */
  particles: number;
  /** 是否启用 Bloom */
  bloom: boolean;
  /** Bloom 强度 */
  bloomIntensity: number;
  /** 是否启用色差 */
  chromaticAberration: boolean;
  /** 是否启用噪点 */
  noise: boolean;
  /** 是否启用 DOF */
  dof: boolean;
  /** 是否启用 Vignette */
  vignette: boolean;
  /** 像素比上限 */
  dpr: [number, number];
  /** 浮动碎片数量 */
  shards: number;
}

function detect(): PerfConfig {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return highEnd();
  }
  const isMobile =
    window.matchMedia("(max-width: 767px)").matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency ?? 4;
  // @ts-expect-error deviceMemory 非标准但可用
  const memory: number = navigator.deviceMemory ?? 4;

  if (isMobile || cores <= 4 || memory <= 4) {
    return lowEnd();
  }
  if (cores <= 6 || memory <= 8) {
    return midEnd();
  }
  return highEnd();
}

function lowEnd(): PerfConfig {
  return {
    tier: 0,
    webgl: false,
    particles: 0,
    bloom: false,
    bloomIntensity: 0,
    chromaticAberration: false,
    noise: false,
    dof: false,
    vignette: false,
    dpr: [1, 1],
    shards: 0,
  };
}

function midEnd(): PerfConfig {
  return {
    tier: 1,
    webgl: true,
    particles: 1200,
    bloom: true,
    bloomIntensity: 0.6,
    chromaticAberration: true,
    noise: true,
    dof: false,
    vignette: true,
    dpr: [1, 1.5],
    shards: 8,
  };
}

function highEnd(): PerfConfig {
  return {
    tier: 2,
    webgl: true,
    particles: 2600,
    bloom: true,
    bloomIntensity: 0.85,
    chromaticAberration: true,
    noise: true,
    dof: false, // DOF 在动态背景中容易抖动，默认关闭
    vignette: true,
    dpr: [1, 2],
    shards: 14,
  };
}

export function usePerformanceTier(): PerfConfig {
  const [config, setConfig] = useState<PerfConfig>(() => lowEnd());

  useEffect(() => {
    setConfig(detect());
  }, []);

  return config;
}

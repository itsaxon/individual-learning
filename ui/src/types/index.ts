/**
 * 摸鱼舱 MOYU — 全局类型定义
 */

export type AccentColor = "violet" | "cyan" | "pink" | "mint" | "orange";

export interface Game {
  id: string;
  title: string;
  cover: string;
  coverH?: string;
  rating: number;
  players: number;
  category: string;
  tags: string[];
  description?: string;
  accent: AccentColor;
  /** 用于最近游玩的进度 */
  progress?: number;
  /** 真实可玩游戏的路由（如 "#/games/cihai-xunzong"） */
  href?: string;
  /** 是否为新上线的游戏（用于角标） */
  isNew?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  accent: AccentColor;
}

export interface LeaderEntry {
  rank: number;
  game: Game;
  metric: number;
  metricLabel: string;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  accent: AccentColor;
}

export type LeaderboardTab = "top" | "popular" | "new" | "trending";

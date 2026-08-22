/**
 * 摸鱼舱 MOYU — Mock 数据
 * 所有封面图走 SDXL text-to-image 占位图服务
 */

import type { AccentColor, BannerSlide, Category, Game, LeaderEntry } from "@/types";

/** 图片生成器：使用 SDXL text-to-image 服务生成游戏封面 */
const IMG_BASE = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image";

function cover(prompt: string, size: "portrait_4_3" | "landscape_16_9" = "portrait_4_3") {
  return `${IMG_BASE}?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;
}

/* ============================================================
   热门游戏（横向卡片列表）
   词海寻踪作为主打游戏放在第一位
   4 张卡片：词海寻踪 / 九宫寻数 / 找出冒牌货 / 人生重开
   卡片封面统一采用「dark atmospheric + cinematic + 主题色」风格
   ============================================================ */
export const popularGames: Game[] = [
  {
    id: "cihai-xunzong",
    title: "词海寻踪",
    cover: cover(
      "mysterious word puzzle game key art, glowing chinese calligraphy characters floating in deep navy atmospheric space, one large central character glowing cyan as the hidden word, other characters faint and scattered in dark mist, dramatic spotlight from above illuminating the central word, soft blue light beams cutting through dark fog, ink strokes dissolving into stardust, calligraphy puzzle aesthetic, premium minimalist cinematic board game cover, ultra detailed, depth of field",
      "landscape_16_9",
    ),
    rating: 9.8,
    players: 312045,
    category: "猜词",
    tags: ["益智", "每日", "中文"],
    accent: "cyan",
    description: "在词海中循迹，用最少次数寻得隐藏的词语。",
    href: "#/games/cihai-xunzong",
    isNew: true,
  },
  {
    id: "jiugong-xunshu",
    title: "九宫寻数",
    cover: cover(
      "dark atmospheric sudoku puzzle key art, glowing 9x9 grid floating in deep navy space with cyan and blue numbers, dramatic spotlight from above illuminating the grid, soft blue light beams cutting through dark mist, mathematical logic aesthetic, premium minimalist cinematic, ultra detailed, depth of field",
      "landscape_16_9",
    ),
    rating: 9.5,
    players: 245678,
    category: "数独",
    tags: ["益智", "逻辑", "数独"],
    accent: "cyan",
    description: "经典九宫数独，四难度挑战逻辑极限。",
    href: "#/games/jiugong-xunshu",
    isNew: true,
  },
  {
    id: "zhaochu-maopaihuo",
    title: "找出冒牌货",
    cover: cover(
      "social deduction game key art, group of mysterious silhouettes around a table, one figure glowing red as impostor, warm orange and red lighting, dark atmospheric background with spotlights, interrogative mood, cinematic, ultra detailed, premium board game cover",
      "landscape_16_9",
    ),
    rating: 9.3,
    players: 98421,
    category: "社交推理",
    tags: ["多人", "推理", "联机"],
    accent: "orange",
    description: "3-12 人实时联机，谁是潜伏的冒牌货？",
    href: "#/games/zhaochu-maopaihuo",
    isNew: true,
  },
  {
    id: "rensheng-chongkai",
    title: "人生重开",
    cover: cover(
      "xianxia cultivation game key art, mysterious cultivator silhouette meditating under glowing spiritual tree, swirling golden qi energy and floating talismans around, dark atmospheric background with warm amber and deep violet spotlights, ancient chinese pavilion in mist, reincarnation cycle motif, cinematic premium board game cover, ultra detailed, depth of field",
      "landscape_16_9",
    ),
    rating: 9.6,
    players: 198342,
    category: "文字模拟",
    tags: ["模拟", "文字", "重开"],
    accent: "violet",
    description: "一念之间，重来一生。内含文字修仙模式。",
    href: "#/games/rensheng-chongkai",
    isNew: true,
  },
  {
    id: "apex-racers",
    title: "APEX RACERS",
    cover: cover(
      "futuristic neon hover car racing on cyberpunk highway at night, motion blur light trails, dramatic perspective, high speed action, video game cover art, vibrant magenta and cyan lights",
    ),
    rating: 8.9,
    players: 142332,
    category: "竞速",
    tags: ["竞速", "街机", "联机"],
    accent: "mint",
    description: "未来赛道上的极限竞速，霓虹光轨划破夜空。",
    href: "#/games/cihai-xunzong",
  },
  {
    id: "crystal-legion",
    title: "CRYSTAL LEGION",
    cover: cover(
      "epic fantasy warrior with glowing crystal armor and magic sword, dramatic battlefield at sunset, cinematic fantasy video game cover art, vibrant purple and gold lighting, ultra detailed",
    ),
    rating: 8.7,
    players: 128450,
    category: "MOBA",
    tags: ["MOBA", "奇幻", "对战"],
    accent: "violet",
    description: "水晶军团，决胜战场。",
    href: "#/games/cihai-xunzong",
  },
  {
    id: "pulse-arena",
    title: "PULSE ARENA",
    cover: cover(
      "epic esports arena with intense laser light show, massive led screens, cheering crowd silhouettes, dramatic stage lighting, cyberpunk gaming tournament atmosphere, vibrant cyan and magenta neon beams, ultra detailed video game cover art",
    ),
    rating: 8.5,
    players: 98734,
    category: "FPS",
    tags: ["电竞", "竞技场", "对抗"],
    accent: "cyan",
    description: "电竞之巅，节奏即胜负。",
    href: "#/games/cihai-xunzong",
  },
];

/* ============================================================
   游戏分类（4×2 网格）
   ============================================================ */
export const categories: Category[] = [
  { id: "fps", name: "FPS", icon: "Crosshair", count: 248, accent: "pink" },
  { id: "moba", name: "MOBA", icon: "Swords", count: 86, accent: "violet" },
  { id: "rpg", name: "RPG", icon: "Wand2", count: 412, accent: "cyan" },
  { id: "sim", name: "模拟经营", icon: "Cpu", count: 173, accent: "mint" },
  { id: "racing", name: "竞速", icon: "Car", count: 94, accent: "pink" },
  { id: "strategy", name: "策略", icon: "Brain", count: 138, accent: "cyan" },
  { id: "puzzle", name: "解谜", icon: "Puzzle", count: 256, accent: "mint" },
  { id: "arcade", name: "街机", icon: "Joystick", count: 187, accent: "violet" },
];

/* ============================================================
   今日推荐 Banner（轮播）
   词海寻踪作为主打放在第一位
   ============================================================ */
export const bannerSlides: BannerSlide[] = [
  {
    id: "b1",
    title: "词海寻踪",
    subtitle: "用最少的次数猜中一个隐藏词语。每日全员共猜同一个词。",
    image: cover(
      "wide cinematic shot of vast dark cosmic ocean with floating glowing chinese calligraphy characters, ink strokes dissolving into stardust, cyan and violet neon light beams, deep mysterious atmospheric puzzle game key art, ultra detailed",
      "landscape_16_9",
    ),
    cta: "立即开玩",
    accent: "cyan",
  },
  {
    id: "b2",
    title: "ECHOES OF VOID",
    subtitle: "穿越虚空，与未知对话。全新 DLC「黯星回响」现已上线。",
    image: cover(
      "cinematic wide shot of astronaut on alien desert planet with massive ringed planet rising on horizon, two moons in sky, dramatic purple and orange cosmic lighting, epic sci-fi movie poster style, ultra detailed",
      "landscape_16_9",
    ),
    cta: "进入战场",
    accent: "violet",
  },
  {
    id: "b3",
    title: "APEX RACERS",
    subtitle: "光速赛道，胜负在毫秒之间。全新赛季「裂空」开启。",
    image: cover(
      "dynamic wide shot of futuristic hover car racing on neon cyberpunk highway, light streaks motion blur, dramatic perspective from low angle, vibrant magenta and cyan glow, action video game cover art",
      "landscape_16_9",
    ),
    cta: "启动引擎",
    accent: "pink",
  },
];

/* ============================================================
   排行榜（4 个 Tab）
   索引：[0]词海寻踪 [1]九宫寻数 [2]找出冒牌货 [3]人生重开 [4]APEX [5]CRYSTAL [6]PULSE
   ============================================================ */
export const leaderboardData: Record<string, LeaderEntry[]> = {
  top: [
    { rank: 1, game: popularGames[0], metric: 9.8, metricLabel: "评分" },
    { rank: 2, game: popularGames[3], metric: 9.6, metricLabel: "评分" },
    { rank: 3, game: popularGames[1], metric: 9.5, metricLabel: "评分" },
    { rank: 4, game: popularGames[2], metric: 9.3, metricLabel: "评分" },
    { rank: 5, game: popularGames[4], metric: 8.9, metricLabel: "评分" },
  ],
  popular: [
    { rank: 1, game: popularGames[0], metric: 312045, metricLabel: "在线玩家" },
    { rank: 2, game: popularGames[1], metric: 245678, metricLabel: "在线玩家" },
    { rank: 3, game: popularGames[3], metric: 198342, metricLabel: "在线玩家" },
    { rank: 4, game: popularGames[2], metric: 98421, metricLabel: "在线玩家" },
    { rank: 5, game: popularGames[4], metric: 142332, metricLabel: "在线玩家" },
  ],
  new: [
    { rank: 1, game: popularGames[0], metric: 100, metricLabel: "本周热度" },
    { rank: 2, game: popularGames[1], metric: 95, metricLabel: "本周热度" },
    { rank: 3, game: popularGames[3], metric: 92, metricLabel: "本周热度" },
    { rank: 4, game: popularGames[4], metric: 87, metricLabel: "本周热度" },
    { rank: 5, game: popularGames[2], metric: 78, metricLabel: "本周热度" },
  ],
  trending: [
    { rank: 1, game: popularGames[0], metric: 320, metricLabel: "本周增长" },
    { rank: 2, game: popularGames[1], metric: 312, metricLabel: "本周增长" },
    { rank: 3, game: popularGames[5], metric: 268, metricLabel: "本周增长" },
    { rank: 4, game: popularGames[2], metric: 224, metricLabel: "本周增长" },
    { rank: 5, game: popularGames[3], metric: 198, metricLabel: "本周增长" },
  ],
};

/* ============================================================
   最近游玩（登录态）
   词海寻踪作为最近游玩的第一位
   ============================================================ */
export const continuePlaying: Game[] = [
  {
    ...popularGames[0],
    progress: 68,
  },
  {
    ...popularGames[1],
    progress: 42,
  },
  {
    ...popularGames[2],
    progress: 87,
  },
];

/* ============================================================
   工具：accent → 颜色映射
   ============================================================ */
export const accentColorMap: Record<AccentColor, { hex: string; rgb: string; tailwind: string }> = {
  // 亮色背景用更深的同色系，保证对比度
  violet: { hex: "#6d28d9", rgb: "109,40,217", tailwind: "text-violet-600" },
  cyan: { hex: "#0284c7", rgb: "2,132,199", tailwind: "text-sky-600" },
  pink: { hex: "#db2777", rgb: "219,39,119", tailwind: "text-pink-600" },
  mint: { hex: "#059669", rgb: "5,150,105", tailwind: "text-emerald-600" },
  orange: { hex: "#ea580c", rgb: "234,88,12", tailwind: "text-orange-600" },
};

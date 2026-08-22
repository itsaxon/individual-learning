/**
 * HomePage — 摸鱼舱首页
 * 聚合 Section：Hero / PopularGames / PopularNovels
 * （已隐藏：GameCategories / FeaturedBanner / Leaderboard / ContinuePlaying）
 */
import { useState } from "react";
import { motion } from "framer-motion";
import Hero from "@/components/sections/Hero";
import PopularGames from "@/components/sections/PopularGames";
import PopularNovels from "@/components/sections/PopularNovels";

export default function HomePage({ revealed }: { revealed: boolean }) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: revealed ? 1 : 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10"
    >
      <Hero />
      <PopularGames />
      <PopularNovels />
    </motion.main>
  );
}

// 留作 hook，方便后续重置状态
export function useRevealed() {
  return useState(false);
}

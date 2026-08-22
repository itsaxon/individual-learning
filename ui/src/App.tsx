/**
 * 摸鱼舱 MOYU — App Root
 *
 * 亮色蓝色主题：移除了所有深色 WebGL/粒子/光晕特效层，
 * 仅保留全局浅蓝渐变背景（CSS body::before/::after）。
 *
 * 路由：
 *   /                          — 首页（HomePage）
 *   /games/cihai-xunzong       — 词海寻踪（WordGuessGamePage）
 *   /games/jiugong-xunshu      — 九宫寻数（SudokuPage）
 *   /games/zhaochu-maopaihuo   — 找出冒牌货（ImpostorPage）
 *   /games/rensheng-chongkai    — 人生重开（LifeRestartPage，含修仙切换）
 */
import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useLenis } from "@/hooks/useLenis";
import Loader from "@/components/layout/Loader";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import CompanionPet from "@/components/companion/CompanionPet";
import HomePage from "@/pages/HomePage";
import WordGuessGamePage from "@/pages/WordGuessGamePage";
import SudokuPage from "@/pages/SudokuPage";
import ImpostorPage from "@/pages/ImpostorPage";
import LifeRestartPage from "@/pages/LifeRestartPage";
import WorkerAssistantPage from "@/pages/WorkerAssistantPage";
import NovelPage from "@/pages/NovelPage";
import AllGamesPage from "@/pages/AllGamesPage";

export default function App() {
  useLenis();
  const [revealed, setRevealed] = useState(false);
  const location = useLocation();

  // 游戏页 / 打工人助手页 / 小说页 / 全部游戏页不显示进场 Loading
  const isAppPage =
    location.pathname.startsWith("/games/") ||
    location.pathname.startsWith("/games") ||
    location.pathname.startsWith("/worker") ||
    location.pathname.startsWith("/novels");

  return (
    <>
      {/* 路由变化时滚到顶部 */}
      <ScrollToTop />

      {/* 进场 Loading（仅首次进入首页时显示，避免从游戏页返回时重复加载） */}
      {!isAppPage && !revealed && <Loader onComplete={() => setRevealed(true)} />}

      {/* 顶部导航 */}
      {!isAppPage && <Navbar />}

      {/*
        主内容：直接渲染 Routes，不使用 AnimatePresence mode="wait"。
        原因：AnimatePresence mode="wait" 在切换路由时需要等待旧组件 exit 动画完成，
        但 LifeRestartPage 的「文字修仙」分支根节点是 <div className="fixed inset-0 z-40">
        （非 motion 组件且无 exit），导致 AnimatePresence 无法识别 exit 完成时机，
        旧组件无法卸载，新组件（HomePage）无法挂载，最终页面卡死在文字修仙界面。
        移除 AnimatePresence 后，Routes 在路由变化时同步卸载旧组件、挂载新组件，
        各页面内部的 motion 组件仍保留进场动画，仅失去路由切换的整体过渡效果。
      */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage revealed={revealed} />} />
        <Route
          path="/games/cihai-xunzong"
          element={<WordGuessGamePage />}
        />
        <Route
          path="/games/jiugong-xunshu"
          element={<SudokuPage />}
        />
        <Route
          path="/games/zhaochu-maopaihuo"
          element={<ImpostorPage />}
        />
        <Route
          path="/games/rensheng-chongkai"
          element={<LifeRestartPage />}
        />
        <Route path="/worker" element={<WorkerAssistantPage />} />
        <Route path="/novels" element={<NovelPage />} />
        <Route path="/games" element={<AllGamesPage />} />
        <Route path="*" element={<HomePage revealed={revealed} />} />
      </Routes>

      {!isAppPage && <Footer />}

      {/* 全局陪伴宠物（可开关） */}
      <CompanionPet />
    </>
  );
}

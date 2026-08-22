/**
 * XiuxianGame — 修仙游戏入口组件
 *
 * 默认导出，可直接在 LifeRestartPage 中渲染。
 * 风格：白色亮色主题（与词海寻踪/九宫寻数一致），金色作为强调色。
 *
 * 内部使用 React Context + reducer 管理状态，localStorage 自动持久化。
 * 顶部 Tab 切换不同页面（home/cultivate/explore/boss/endless/map/game） */
import { AnimatePresence, motion } from 'framer-motion'
import {
  Home, Sparkles, Crown, Swords, Dices, Map as MapIcon,
} from 'lucide-react'
import { GameProvider, useGame, type GamePage as PageType } from './logic/store'
import { NotificationHost } from './components/ui'
import HomePage from './components/HomePage'
import CultivatePage from './components/CultivatePage'
import ExplorePage from './components/ExplorePage'
import BossPage from './components/BossPage'
import EndlessPage from './components/EndlessPage'
import MapExplorationPage from './components/MapExplorationPage'
import GamePage from './components/GamePage'

const NAV: { id: PageType; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: '主页', icon: <Home className="h-4 w-4" /> },
  { id: 'cultivate', label: '修炼', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'map', label: '探索', icon: <MapIcon className="h-4 w-4" /> },
  { id: 'boss', label: '世界Boss', icon: <Crown className="h-4 w-4" /> },
  { id: 'endless', label: '无尽塔', icon: <Swords className="h-4 w-4" /> },
  { id: 'game', label: '小游戏', icon: <Dices className="h-4 w-4" /> },
]

/** 标准中文字体栈 */
const CN_FONT =
  '"PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Hiragino Sans GB", "Source Han Sans SC", sans-serif'

/** 内部：根据当前 page 渲染对应组件 */
function PageRenderer() {
  const { state } = useGame()
  switch (state.page) {
    case 'home':
      return <HomePage />
    case 'cultivate':
      return <CultivatePage />
    case 'explore':
      return <ExplorePage />
    case 'boss':
      return <BossPage />
    case 'endless':
      return <EndlessPage />
    case 'map':
      return <MapExplorationPage />
    case 'game':
      return <GamePage />
    default:
      return <HomePage />
  }
}

/** 内部：带导航栏与背景的主容器 */
function XiuxianGameShell() {
  const { state, dispatch } = useGame()

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900"
      style={{ fontFamily: CN_FONT }}
    >
      {/* 背景光晕（淡） */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -left-40 -top-40 h-[40rem] w-[40rem] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 65%)',
            animation: 'xx-float-a 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -right-48 -top-24 h-[36rem] w-[36rem] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 65%)',
            animation: 'xx-float-b 22s ease-in-out infinite',
          }}
        />
        {/* 背景汉字水印 */}
        <span
          className="absolute right-[6%] top-[8%] hidden select-none font-bold text-blue-500/[0.06] sm:block"
          style={{ fontSize: '12rem', fontFamily: CN_FONT }}
        >
          仙
        </span>
        <span
          className="absolute left-[8%] bottom-[10%] hidden select-none font-bold text-violet-500/[0.05] sm:block"
          style={{ fontSize: '10rem', fontFamily: CN_FONT }}
        >
          道
        </span>
      </div>

      {/* 顶部：标题 + 导航 */}
      <header className="mx-auto w-full max-w-5xl px-3 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-black tracking-tight sm:text-4xl"
          >
            <span className="bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 bg-clip-text text-transparent">
              文字修仙
            </span>
          </motion.h1>
          <p className="mt-1.5 text-sm tracking-[0.3em] text-slate-500">
            一 念 修 仙  万 法 归 一
          </p>
        </div>

        {/* 导航 Tab */}
        <nav className="mx-auto flex max-w-3xl items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur-md">
          {NAV.map((n) => {
            const active = state.page === n.id
            return (
              <button
                key={n.id}
                onClick={() => dispatch({ type: 'SET_PAGE', payload: n.id })}
                className={
                  'relative flex-1 whitespace-nowrap rounded-xl px-2 py-2 text-center text-xs font-medium transition-colors sm:px-3 sm:py-2.5 sm:text-sm ' +
                  (active
                    ? 'text-blue-700'
                    : 'text-slate-500 hover:text-slate-800')
                }
              >
                {active && (
                  <motion.span
                    layoutId="xx-nav-pill"
                    className="absolute inset-0 rounded-xl border border-blue-300 bg-gradient-to-r from-blue-100 to-sky-100"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  {n.icon}
                  <span>{n.label}</span>
                </span>
              </button>
            )
          })}
        </nav>
      </header>

      {/* 主内容 */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-5 sm:px-6 sm:py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            <PageRenderer />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 通知 */}
      <NotificationHost
        notification={state.notification}
        onDismiss={() => dispatch({ type: 'CLEAR_NOTIFICATION' })}
      />

      {/* 局部样式 */}
      <style>{`
        @keyframes xx-float-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 30px) scale(1.05); }
        }
        @keyframes xx-float-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -40px) scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pointer-events-none.fixed > div {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}

/** 默认导出：包含 GameProvider */
export default function XiuxianGame() {
  return (
    <GameProvider>
      <XiuxianGameShell />
    </GameProvider>
  )
}

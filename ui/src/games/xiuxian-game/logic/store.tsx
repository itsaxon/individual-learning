/**
 * 修仙游戏 — React 状态管理
 *
 * 替代 Vue 版的 Pinia store（plugins/store.js）。
 * 使用 React Context + useReducer 模式 + localStorage 持久化。
 *
 * 简化点：
 * - 原 Vue 版使用 CryptoJS 加密存档，这里改为明文 JSON（不引入新依赖）。
 * - 持久化路径仅 player / boss / monster / mapData，与原版一致。
 */
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { Boss, Monster, Player } from './types'
import { shop } from './shop'

const STORAGE_KEY = 'xiuxian-game-save-v1'

/** 地图数据 */
export interface MapData {
  y: number
  x: number
  map: number[][]
}

/** 完整游戏状态 */
export interface GameState {
  player: Player
  boss: Boss
  monster: Monster
  mapData: MapData
  mapScroll: number
  fishingMap: number[]
  /** UI 状态：当前所在页面 */
  page: GamePage
  /** 临时通知（替代 Element Plus 的 gameNotifys） */
  notification: { title: string; message: string; id: number } | null
}

/** 游戏页面 */
export type GamePage =
  | 'home'
  | 'cultivate'
  | 'explore'
  | 'boss'
  | 'endless'
  | 'map'
  | 'game'

/** 创建初始玩家 */
export const createInitialPlayer = (): Player => ({
  zc: false,
  age: 1,
  pet: {},
  time: 0,
  name: '修仙者',
  dark: false,
  npcs: [],
  wife: {},
  pets: [],
  wifes: [],
  props: {
    money: 1000,
    flying: 0,
    qingyuan: 0,
    rootBone: 0,
    currency: 0,
    cultivateDan: 0,
    strengtheningStone: 0,
  },
  score: 0,
  level: 0,
  dodge: 0,
  points: 0,
  attack: 10,
  health: 100,
  critical: 0,
  defense: 10,
  taskNum: 0,
  version: 0.8,
  currency: 0,
  maxHealth: 100,
  inventory: [],
  isNewbie: true,
  shopData: shop.drawPrize(1),
  equipment: {
    sutra: {},
    armor: {},
    weapon: {},
    accessory: {},
  },
  achievement: {
    pet: [],
    monster: [],
    equipment: [],
  },
  script: '',
  cultivation: 0,
  currentTitle: null,
  reincarnation: 0,
  maxCultivation: 100,
  backpackCapacity: 50,
  sellingEquipmentData: [],
  highestTowerFloor: 1,
  rewardedTowerFloors: [],
  nextGameTimes: {
    rps: null,
    dice: null,
    fortune: null,
    secretrealm: 0,
    gamblingStone: null,
  },
  gameWins: 0,
  gameLosses: 0,
  checkinDays: 0,
  checkinStreak: 0,
  lastCheckinDate: null,
  fortuneTellingDate: null,
  checkedInToday: false,
})

/** 创建初始 Boss */
export const createInitialBoss = (): Boss => ({
  name: '',
  text: '',
  time: 0,
  desc: '',
  level: 0,
  dodge: 0,
  attack: 0,
  health: 0,
  conquer: false,
  defense: 0,
  critical: 0,
  maxhealth: 0,
})

/** 初始状态 */
const createInitialState = (): GameState => ({
  player: createInitialPlayer(),
  boss: createInitialBoss(),
  monster: { name: '', health: 0, attack: 0, defense: 0, dodge: 0, critical: 0 },
  mapData: { y: 0, x: 0, map: [] },
  mapScroll: 0,
  fishingMap: [],
  page: 'home',
  notification: null,
})

/** Action 类型 */
export type GameAction =
  | { type: 'SET_PLAYER'; payload: Player }
  | { type: 'UPDATE_PLAYER'; payload: Partial<Player> }
  | { type: 'SET_BOSS'; payload: Boss }
  | { type: 'SET_MONSTER'; payload: Monster }
  | { type: 'SET_MAP_DATA'; payload: MapData }
  | { type: 'SET_MAP_SCROLL'; payload: number }
  | { type: 'SET_FISHING_MAP'; payload: number[] }
  | { type: 'SET_PAGE'; payload: GamePage }
  | { type: 'NOTIFY'; payload: { title: string; message: string } }
  | { type: 'CLEAR_NOTIFICATION' }
  | { type: 'RESET' }
  | { type: 'LOAD'; payload: GameState }
  | { type: 'PATCH_PLAYER_PROPS'; payload: Partial<Player['props']> }

/** reducer */
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_PLAYER':
      return { ...state, player: action.payload }
    case 'UPDATE_PLAYER':
      return { ...state, player: { ...state.player, ...action.payload } }
    case 'PATCH_PLAYER_PROPS':
      return {
        ...state,
        player: { ...state.player, props: { ...state.player.props, ...action.payload } },
      }
    case 'SET_BOSS':
      return { ...state, boss: action.payload }
    case 'SET_MONSTER':
      return { ...state, monster: action.payload }
    case 'SET_MAP_DATA':
      return { ...state, mapData: action.payload }
    case 'SET_MAP_SCROLL':
      return { ...state, mapScroll: action.payload }
    case 'SET_FISHING_MAP':
      return { ...state, fishingMap: action.payload }
    case 'SET_PAGE':
      return { ...state, page: action.payload }
    case 'NOTIFY':
      return {
        ...state,
        notification: { ...action.payload, id: Date.now() },
      }
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null }
    case 'RESET':
      return createInitialState()
    case 'LOAD':
      return action.payload
    default:
      return state
  }
}

/** 持久化存储 — 仅保存 player/boss/monster/mapData（与原版一致） */
const persistState = (state: GameState) => {
  try {
    const saved = {
      player: state.player,
      boss: state.boss,
      monster: state.monster,
      mapData: state.mapData,
      mapScroll: state.mapScroll,
      fishingMap: state.fishingMap,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch (e) {
    console.warn('[xiuxian-game] 存档失败', e)
  }
}

const loadState = (): GameState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    const initial = createInitialState()
    return {
      ...initial,
      player: { ...initial.player, ...saved.player },
      boss: { ...initial.boss, ...saved.boss },
      monster: { ...initial.monster, ...saved.monster },
      mapData: saved.mapData || initial.mapData,
      mapScroll: saved.mapScroll || 0,
      fishingMap: saved.fishingMap || [],
    }
  } catch (e) {
    console.warn('[xiuxian-game] 读档失败', e)
    return null
  }
}

/** Context 类型 */
interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  /** 通知快捷方法 */
  notify: (title: string, message: string) => void
  /** 重置存档 */
  resetGame: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

/** Provider */
export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    const loaded = loadState()
    return loaded || createInitialState()
  })

  // 自动持久化（防抖）
  useEffect(() => {
    const timer = setTimeout(() => persistState(state), 300)
    return () => clearTimeout(timer)
  }, [state.player, state.boss, state.monster, state.mapData, state.mapScroll, state.fishingMap])

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      dispatch,
      notify: (title, message) => dispatch({ type: 'NOTIFY', payload: { title, message } }),
      resetGame: () => {
        localStorage.removeItem(STORAGE_KEY)
        dispatch({ type: 'RESET' })
      },
    }),
    [state],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

/** Hook */
export const useGame = (): GameContextValue => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame 必须在 GameProvider 内使用')
  return ctx
}

/** 直接读取玩家（便捷 hook） */
export const usePlayer = (): Player => useGame().state.player

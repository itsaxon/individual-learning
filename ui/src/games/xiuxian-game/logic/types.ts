/**
 * 修仙游戏 — 类型定义
 *
 * 从 Vue 版本（plugins/store.js 中的 state 结构）迁移而来。
 * 去除了 Vue 的响应式依赖，仅保留纯数据结构。
 */

/** 装备品质（对应原版 Element Plus tag type） */
export type Quality =
  | 'info' // 黄阶（白）
  | 'success' // 玄阶（绿）
  | 'primary' // 地阶（蓝）
  | 'purple' // 天阶（紫）
  | 'warning' // 帝阶（金）
  | 'danger' // 神阶（红）
  | 'pink' // 仙阶（粉）

/** 装备类型 */
export type EquipType = 'weapon' | 'armor' | 'accessory' | 'sutra'

/** 装备初始属性 */
export interface EquipInitial {
  dodge: number
  attack: number
  health: number
  defense: number
  critical: number
  rootBone?: number
}

/** 装备数据 */
export interface Equipment {
  id: number
  name: string
  type: EquipType
  lock?: boolean
  level: number
  score: number
  dodge: number
  attack: number
  health: number
  defense: number
  critical: number
  initial: EquipInitial
  quality: Quality
  strengthen?: number
  prize?: number
}

/** 灵宠数据 */
export interface Pet {
  id: number
  lock?: boolean
  name: string
  level: number
  score: number
  dodge: number
  health: number
  attack: number
  defense: number
  critical: number
  initial: EquipInitial
  rootBone?: number
  favorability?: number
  reincarnation?: number
}

/** 道侣数据 */
export interface Wife {
  name: string
  level: number
  dodge: number
  attack: number
  health: number
  defense: number
  critical: number
  reincarnation?: number
}

/** NPC 数据 */
export interface Npc {
  lv: number
  name: string
  position: number
  favorability: number
  reincarnation: number
}

/** 怪物数据 */
export interface Monster {
  name: string
  health: number
  attack: number
  defense: number
  dodge: number
  critical: number
  level?: number
  maxHealth?: number
}

/** Boss 数据 */
export interface Boss {
  name: string
  text: string
  time: number
  desc: string
  level: number
  dodge: number
  attack: number
  health: number
  conquer: boolean
  defense: number
  critical: number
  maxhealth: number
}

/** 玩家属性道具 */
export interface PlayerProps {
  money: number
  flying: number
  qingyuan: number
  rootBone: number
  currency: number
  cultivateDan: number
  strengtheningStone: number
}

/** 玩家已穿戴装备 */
export interface PlayerEquipment {
  sutra: Partial<Equipment> | Equipment
  armor: Partial<Equipment> | Equipment
  weapon: Partial<Equipment> | Equipment
  accessory: Partial<Equipment> | Equipment
}

/** 玩家成就记录 */
export interface PlayerAchievement {
  pet: { id: number }[]
  monster: { id: number }[]
  equipment: { id: number }[]
}

/** 小游戏冷却时间 */
export interface NextGameTimes {
  rps: number | null
  dice: number | null
  fortune: number | null
  secretrealm: number
  gamblingStone: number | null
}

/** 玩家数据 */
export interface Player {
  zc: boolean
  age: number
  pet: Pet | Record<string, never>
  time: number
  name: string
  dark: boolean
  npcs: Npc[]
  wife: Wife | Record<string, never>
  pets: Pet[]
  wifes: Wife[]
  props: PlayerProps
  score: number
  level: number
  dodge: number
  points: number
  attack: number
  health: number
  critical: number
  defense: number
  taskNum: number
  version: number
  currency: number
  maxHealth: number
  inventory: Equipment[]
  isNewbie: boolean
  shopData: ShopCategory[]
  equipment: PlayerEquipment
  achievement: PlayerAchievement
  script: string
  cultivation: number
  currentTitle: string | null
  reincarnation: number
  maxCultivation: number
  backpackCapacity: number
  sellingEquipmentData: Quality[]
  highestTowerFloor: number
  rewardedTowerFloors: number[]
  nextGameTimes: NextGameTimes
  gameWins: number
  gameLosses: number
  checkinDays: number
  checkinStreak: number
  lastCheckinDate: string | null
  fortuneTellingDate: string | null
  checkedInToday: boolean
  jishaNum?: number
}

/** 商店类别 */
export interface ShopCategory {
  type: EquipType
  name: string
  data: Equipment[]
}

/** 成就条件 */
export interface AchievementCondition {
  dodge?: number
  health?: number
  attack?: number
  defense?: number
  critical?: number
  level?: number
  monstersDefeated?: number
  money?: number
  highestTowerFloor?: number
  age?: number
  gameWins?: number
}

/** 称号加成 */
export interface TitleBonus {
  dodge?: number
  attack?: number
  health?: number
  critical?: number
  defense?: number
}

/** 成就数据 */
export interface Achievement {
  id: number
  name: string
  desc?: string
  award: number
  titleBonus: TitleBonus
  condition: AchievementCondition
}

/** 成就类别 */
export interface AchievementCategory {
  name: string
  type: 'pet' | 'monster' | 'equipment'
  data: Achievement[]
}

/** 战斗回合结果 */
export interface CombatRoundResult {
  damage: number
  isCritical: boolean
  isHit: boolean
  remainingHealth: number
}

/** 战斗者接口（玩家/宠物/怪物/Boss通用） */
export interface Combatant {
  name?: string
  attack: number
  defense: number
  health: number
  dodge: number
  critical: number
  level?: number
  maxHealth?: number
}

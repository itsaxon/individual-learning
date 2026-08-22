/**
 * 修仙游戏 — 常量与工具函数
 *
 * 移植自 plugins/game.js，去除了 Element Plus 依赖（gameNotifys 改为事件回调）。
 */
import type { Quality, EquipType } from './types'

/** 最高境界等级 */
export const maxLv = 144

/** 装备类型 → 中文名 */
export const genre: Record<EquipType, string> = {
  sutra: '法器',
  armor: '护甲',
  weapon: '神兵',
  accessory: '灵宝',
}

/** 装备品质 → 阶位名 */
export const levels: Record<Quality, string> = {
  info: '黄阶',
  pink: '仙阶',
  danger: '神阶',
  purple: '天阶',
  primary: '地阶',
  success: '玄阶',
  warning: '帝阶',
}

/** 品质数值排序用 */
export const levelsNum: Record<Quality, number> = {
  info: 1,
  pink: 7,
  danger: 6,
  purple: 4,
  primary: 3,
  success: 2,
  warning: 5,
}

/** 道具名映射 */
export const propItemNames: Record<string, { name: string; desc: string }> = {
  money: { name: '灵石', desc: '可以通过分解获得装备获得' },
  flying: { name: '传送符', desc: '可以通过赠送礼物给NPC获得' },
  rootBone: { name: '悟性丹', desc: '可以通过击败世界BOSS获得' },
  qingyuan: { name: '情缘', desc: '可以通过赠送礼物给NPC获得' },
  currency: { name: '鸿蒙石', desc: '可以通过击败世界BOSS获得' },
  cultivateDan: { name: '培养丹', desc: '可以通过探索获得' },
  strengtheningStone: { name: '炼器石', desc: '可以通过分解装备获得' },
}

/** 排序字段下拉选项 */
export const dropdownTypeObject: Record<string, string> = {
  id: '时间',
  level: '境界',
  score: '评分',
  health: '气血',
  attack: '攻击',
  defense: '防御',
  critical: '暴击',
  dodge: '闪避',
}

export const dropdownType = Object.entries(dropdownTypeObject).map(([type, name]) => ({
  type,
  name,
}))

/** 数字转中文单位（万、亿、兆…） */
export const formatNumberToChineseUnit = (number: number): string => {
  number = number > 0 ? Math.floor(number) : 0
  const units = ['', '万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极']
  const bigTenThousand = BigInt(10000)
  let num = BigInt(number)
  let unitIndex = 0
  let additionalUnits = ''
  while (num >= bigTenThousand) {
    num /= bigTenThousand
    unitIndex++
    if (unitIndex >= units.length - 1) {
      additionalUnits += '极'
      unitIndex = 0
    }
  }
  return num.toString() + units[unitIndex] + additionalUnits
}

/** 境界名称 */
export const levelNames = (level: number): string => {
  const levelsPerStage = 9
  const stageIndex = Math.floor((level - 1) / levelsPerStage)
  const stageLevel = ((level - 1) % levelsPerStage) + 1
  const numberName: Record<number, string> = {
    1: '一',
    2: '二',
    3: '三',
    4: '四',
    5: '五',
    6: '六',
    7: '七',
    8: '八',
    9: '九',
  }
  const stageNames = [
    '筑基',
    '开光',
    '胎息',
    '辟谷',
    '金丹',
    '元婴',
    '出窍',
    '分神',
    '合体',
    '大乘',
    '渡劫',
    '地仙',
    '天仙',
    '金仙',
    '大罗金仙',
    '九天玄仙',
  ]
  if (level === 0) return '凡人'
  if (level >= maxLv) return '九天玄仙九层'
  return `${stageNames[stageIndex]}${numberName[stageLevel]}层`
}

/** 计算百分比差值（修炼进度） */
export const calculatePercentageDifference = (
  num1: number,
  num2: number,
  maxCultivation: number,
): string => {
  const difference = Math.abs(num1 - num2)
  const percentage = (difference / num1) * 100
  const num3 = maxCultivation - num2 > 0 ? 100 - percentage : 100
  return `${num3.toFixed(2)}%`
}

/** 计算属性差值（用于装备对比） */
export const calculateDifference = (
  item1: number | undefined,
  item2: number | undefined,
): { num: string | number; icon: 'up' | 'down' | '' } => {
  const v1 = item1 || 0
  const v2 = item2 || 0
  const isFloat = (n: number) => Number(n) === n && n % 1 !== 0
  const Float = v1 - parseFloat(String(v2)) < -1 ? -1 : v1 - parseFloat(String(v2)) > 1 ? 1 : v1 - parseFloat(String(v2))
  const num = isFloat(v1) || isFloat(v2) ? (Float * 100).toFixed(2) + '%' : v1 - parseInt(String(v2))
  return {
    num: num === 0 ? '' : num,
    icon: v1 > v2 ? 'up' : v1 === v2 ? '' : 'down',
  }
}

/** 灵宠境界 → 颜色 tag */
export const computePetsLevel = (lv: number): Quality => {
  if (lv >= 1 && lv <= 9) return 'success'
  if (lv >= 10 && lv <= 19) return 'primary'
  if (lv >= 20 && lv <= 29) return 'warning'
  return 'danger'
}

/** 平滑滚动到元素底部 */
export const smoothScrollToBottom = (element: HTMLElement | null) => {
  if (!element) return
  const start = element.scrollTop
  const end = element.scrollHeight
  const duration = 300
  const startTime = performance.now()
  const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const scroll = () => {
    const currentTime = performance.now()
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)
    element.scrollTop = start + (end - start) * easeInOutCubic(progress)
    if (progress < 1) window.requestAnimationFrame(scroll)
  }
  window.requestAnimationFrame(scroll)
}

/** 通用随机整数 [min, max] */
export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** 通用随机浮点数 [min, max) */
export const getRandomFloatInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}

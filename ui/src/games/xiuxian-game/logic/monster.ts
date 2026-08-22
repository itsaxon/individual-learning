/**
 * 怪物生成系统 — 移植自 plugins/monster.js
 */
import { getRandomInt, getRandomFloatInRange } from './game'
import type { Monster } from './types'

const NAMES_LOW = [
  '影魅狸奴', '幽谷灵蛇', '雾隐狐仙', '松间灵猴', '月影蝠妖',
  '山涧蛟童', '林涧鹿灵', '岩隙石精', '风鸣鹤怪', '翠竹蛙仙',
]

const NAMES_MID = [
  '青龙啸天', '白虎破晓', '朱雀焚翼', '玄武镇海', '麒麟踏瑞',
  '凤凰涅槃', '毕方炽焰', '貔貅吞金', '白泽知世', '狻猊御火',
]

const NAMES_HIGH = [
  '伏羲天帝', '女娲圣母', '昊天玉皇', '太上老君', '东华帝君',
  '西王母后', '神农炎帝', '轩辕黄帝', '瑶姬仙子', '真武大帝',
]

const NAMES_TOP = [
  '混沌始元尊', '乾坤造物主', '宇宙创生神', '万灵始祖皇', '鸿蒙创世者',
  '无极造化君', '太虚衍化神', '元始天尊祖', '虚空造物圣', '界域开辟者',
]

export const monster = {
  /** 怪物名 */
  monster_Names: (lv: number): string => {
    if (lv >= 1 && lv <= 19) return NAMES_LOW[Math.floor(Math.random() * NAMES_LOW.length)]
    if (lv >= 20 && lv <= 49) return NAMES_MID[Math.floor(Math.random() * NAMES_MID.length)]
    if (lv >= 50 && lv <= 100) return NAMES_HIGH[Math.floor(Math.random() * NAMES_HIGH.length)]
    return NAMES_TOP[Math.floor(Math.random() * NAMES_TOP.length)]
  },

  /** 怪物攻击 */
  monster_Attack: (lv: number): number => {
    if (lv <= 144) return getRandomInt(50, 150) * lv
    return getRandomInt(10000, 50000) * lv
  },

  /** 怪物气血 */
  monster_Health: (lv: number): number => {
    if (lv <= 144) return getRandomInt(100, 500) * lv
    return getRandomInt(10000, 50000) * lv
  },

  /** 怪物防御 */
  monster_Defense: (lv: number): number => {
    if (lv <= 144) return getRandomInt(1, 15) * lv
    return getRandomInt(500, 1000) * lv
  },

  /** 怪物暴击/闪避率 */
  monster_Criticalhitrate: (lv: number): number => {
    if (lv <= 144) return getRandomFloatInRange(0.001, 0.01)
    return getRandomFloatInRange(0.1, 0.75)
  },

  /** 根据等级生成完整怪物 */
  generate: (lv: number): Monster => {
    const health = monster.monster_Health(lv)
    return {
      name: monster.monster_Names(lv),
      level: lv,
      dodge: monster.monster_Criticalhitrate(lv),
      attack: monster.monster_Attack(lv),
      health,
      defense: monster.monster_Defense(lv),
      critical: monster.monster_Criticalhitrate(lv),
      maxHealth: health,
    }
  },

  getRandomInt,
  getRandomFloatInRange,
}

export default monster

/**
 * 鸿蒙商店 — 移植自 plugins/shop.js
 */
import type { Equipment, EquipType, ShopCategory } from './types'
import { getRandomInt, getRandomFloatInRange } from './game'
import { calculateEquipmentScore } from './equip'

const SHOP_NAMES: Record<EquipType, string[]> = {
  weapon: ['粉晶月刃剑', '樱花吹雪弓', '蔷薇缠绕鞭', '蜜桃梦境杖', '粉蝶幻光刃', '粉晶流光扇', '甜梦水晶枪', '粉樱魔法杖', '粉钻心语弩', '柔粉蔷薇盾'],
  armor: ['粉樱绮梦裳', '甜梦粉蝶衣', '蜜桃恋曲裙', '粉晶流光铠', '樱花恋歌袍', '柔粉蔷薇甲', '粉蝶翩翩袖', '甜梦羽织衣', '粉晶幻彩裙', '蜜桃梦境袍'],
  accessory: ['粉晶梦蝶链', '樱花恋曲簪', '甜梦蔷薇戒', '蜜桃绮梦环', '粉蝶轻舞坠', '粉晶甜蜜链', '柔粉心语珥', '樱花绮梦镯', '蜜桃梦境簪', '粉蝶幻彩带'],
  sutra: ['粉樱梦幻笛', '甜心粉蝶壶', '蜜桃恋语镜', '粉晶流光珠', '柔粉绮梦石', '樱花纷飞扇', '甜梦绮罗盘', '蜜桃幻影灯', '粉蝶织梦琴', '粉樱守护符'],
}

const GENRE: Record<EquipType, string> = {
  sutra: '法器',
  armor: '护甲',
  weapon: '兵器',
  accessory: '灵宝',
}

export const shop = {
  /** 生成商店物品 */
  drawPrize: (lv: number): ShopCategory[] => {
    const types: EquipType[] = ['weapon', 'armor', 'accessory', 'sutra']
    return types.map((type) => {
      const names = SHOP_NAMES[type]
      return {
        type,
        name: GENRE[type],
        data: names.map((name) => {
          const multiplier = 15
          const dodge = getRandomFloatInRange(0.02, 0.25)
          const Attack = getRandomInt(200, 1000) * lv
          const Health = getRandomInt(2000, 10000) * lv
          const defense = getRandomInt(200, 1000) * lv
          const CriticalHitrate = getRandomFloatInRange(0.02, 0.25)
          const isAccOrSutra = ['accessory', 'sutra'].includes(type)
          const isWepOrAccOrSutra = ['weapon', 'accessory', 'sutra'].includes(type)
          const isArmOrAccOrSutra = ['armor', 'accessory', 'sutra'].includes(type)
          const attrs = {
            score: calculateEquipmentScore(dodge, Attack, Health, CriticalHitrate, defense),
            dodge: isAccOrSutra ? dodge : 0,
            attack: isWepOrAccOrSutra ? Attack * multiplier : 0,
            health: isArmOrAccOrSutra ? Health * multiplier : 0,
            defense: isArmOrAccOrSutra ? defense * multiplier : 0,
            critical: isWepOrAccOrSutra ? CriticalHitrate : 0,
          }
          return {
            id: Date.now() + Math.floor(Math.random() * 10000),
            name,
            type,
            lock: true,
            level: lv,
            ...attrs,
            initial: { ...attrs },
            quality: 'pink' as const,
            strengthen: 0,
          } as Equipment
        }),
      }
    })
  },

  getRandomInt,
  getRandomFloatInRange,
  calculateEquipmentScore,
}

export default shop

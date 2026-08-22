/**
 * 世界 Boss 系统 — 移植自 plugins/boss.js
 */
import type { Boss, Equipment, EquipType, Quality } from './types'
import { getRandomInt, getRandomFloatInRange } from './game'
import { calculateEquipmentScore } from './equip'

/** Boss 名称与描述 */
const BOSS_NAMES: { name: string; description: string }[] = [
  { name: '烛龙神尊', description: '乃钟山之神，睁眼为昼，闭眼为夜，呼吸间风云变幻，掌控着时间的流转。' },
  { name: '幽冥鬼帝', description: '传说中幽冥界的至高统治者，掌管生死轮回，其力量深不可测，能召唤万千亡灵为其所用。' },
  { name: '苍穹魔尊', description: '诞生于九天之上，因贪恋凡间情感而堕入魔道，拥有操控天地元素、撕裂虚空的能力。' },
  { name: '龙皇傲天', description: '龙族中的至尊，身披璀璨龙鳞，掌握着古老龙族的所有秘辛与力量，其威严令万兽臣服。' },
  { name: '凤舞九天', description: '凤凰一族的女王，拥有不死之身与涅槃重生的能力，其羽翼轻挥，即可掀起滔天火焰，焚尽一切。' },
  { name: '雷神天尊', description: '天界雷神转世，手持雷神锤，能召唤九天神雷，一击之下，山河破碎，万物寂灭。' },
  { name: '幽冥血皇', description: '幽冥界中的古老存在，以鲜血为食，其力量源自于无尽的杀戮与怨念，令人闻风丧胆。' },
  { name: '玄冰龙神', description: '来自极北之地的神秘生物，融合了龙与冰元素的力量，其身躯坚不可摧，能冻结世间万物。' },
  { name: '金翅大鹏王', description: '大鹏一族中的王者，拥有遮天蔽日的双翼，速度之快，可瞬息万里，其利爪足以撕裂空间。' },
  { name: '混沌魔君', description: '诞生于混沌之初的古老魔物，其力量源自于宇宙的本源，能够扭曲现实，吞噬万物，是天地间最可怕的存在之一。' },
]

/** Boss 语录 */
const BOSS_TEXTS = [
  '你的时代已经结束，现在，是我主宰一切的时候了。',
  '你的努力，终究只是为我铺就了通往胜利的道路。',
  '战胜你，对我来说不过是举手之劳，你的实力，不过如此。',
  '你的生命，在我的手中如蝼蚁般脆弱，你的死亡，只是我计划中的一环。',
  '你的失败，证明了我的智慧与力量无可匹敌，而你，只是我的垫脚石。',
  '你的存在，曾让我感到一丝威胁，但现在，你已成为我脚下的尘埃。',
  '你的勇气可嘉，但可惜，勇气并不能改变结果，你最终还是败在了我的脚下。',
  '你的死，将是我传奇中的一笔，而你，将永远被我踩在脚下。',
  '你的挣扎与反抗，不过是徒劳无功，你的命运，早已注定。',
  '你的终结，是我迈向更高峰的开始，你的存在，对我来说已无任何意义。',
]

/** Boss 掉落装备名称库 */
const BOSS_EQUIP_NAMES: Record<EquipType, string[]> = {
  weapon: [
    '赤焰凤凰剑', '血玉红莲枪', '烈焰焚天弓', '赤霄神火戟', '火舞流云扇',
    '朱雀炎翼鞭', '赤龙焚世刃', '炎狱魔瞳镰', '炽血星辰杖', '红莲业火轮',
  ],
  armor: [
    '烈焰红莲战甲', '赤霄火凤云裳', '朱雀焚天织锦', '赤焰龙鳞宝衣', '血色蔷薇华服',
    '丹霞流光长袍', '炎阳炽烈战袍', '炽火红莲披风', '火舞凤凰羽衣', '红莲业火锦衣',
  ],
  accessory: [
    '赤焰凤凰翎', '血珀琉璃坠', '烈焰红宝石链', '朱雀之翼耳环', '红莲业火镯',
    '丹霄火凤戒', '玛瑙赤焰项链', '炽天使之泪珮', '绯红织锦手环', '火凤涅槃珠链',
  ],
  sutra: [
    '炽焰灵珠阵图', '火凤涅槃炉鼎', '红莲业火净世碑', '血玉轮回盘', '朱雀翔天翼',
    '烈焰焚天炉', '丹霄火域图', '赤龙炼魂珠', '火灵炽心镜', '九转炎灵祭坛',
  ],
}

export const boss = {
  /** 生成世界 Boss */
  drawPrize: (lv: number): Boss => {
    const bossInfo = BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)]
    const health = getRandomInt(50000, 100000) * lv
    return {
      name: bossInfo.name,
      text: BOSS_TEXTS[Math.floor(Math.random() * BOSS_TEXTS.length)],
      time: Math.floor(Date.now() / 1000),
      desc: bossInfo.description,
      level: 144,
      dodge: getRandomFloatInRange(0.1, 0.8),
      attack: getRandomInt(5000, 10000) * lv,
      health,
      defense: getRandomInt(1000, 10000) * lv,
      conquer: false,
      critical: getRandomFloatInRange(0.1, 1),
      maxhealth: health,
    }
  },

  /** Boss 掉落装备 */
  boss_Equip: (lv: number): Equipment => {
    const types: EquipType[] = ['weapon', 'armor', 'accessory', 'sutra']
    const type = types[Math.floor(Math.random() * types.length)]
    const names = BOSS_EQUIP_NAMES[type]
    const dodge = getRandomFloatInRange(0.05, 0.1)
    const Attack = getRandomInt(500, 1000) * lv * 10
    const Health = getRandomInt(5000, 10000) * lv * 10
    const defense = getRandomInt(500, 1000) * lv * 10
    const Criticalhitrate = getRandomFloatInRange(0.05, 0.1)
    const isAccOrSutra = ['accessory', 'sutra'].includes(type)
    const isWepOrAccOrSutra = ['weapon', 'accessory', 'sutra'].includes(type)
    const isArmOrAccOrSutra = ['armor', 'accessory', 'sutra'].includes(type)
    return {
      id: Date.now(),
      name: names[Math.floor(Math.random() * names.length)],
      type,
      level: lv,
      score: calculateEquipmentScore(dodge, Attack, Health, Criticalhitrate, defense),
      dodge: isAccOrSutra ? dodge : 0,
      attack: isWepOrAccOrSutra ? Attack : 0,
      health: isArmOrAccOrSutra ? Health : 0,
      quality: 'danger' as Quality,
      initial: {
        dodge: isAccOrSutra ? dodge : 0,
        attack: isWepOrAccOrSutra ? Attack : 0,
        health: isArmOrAccOrSutra ? Health : 0,
        defense: isAccOrSutra ? defense : 0,
        critical: isWepOrAccOrSutra ? Criticalhitrate : 0,
      },
      defense: isArmOrAccOrSutra ? defense : 0,
      critical: isWepOrAccOrSutra ? Criticalhitrate : 0,
      strengthen: 0,
      lock: false,
    }
  },

  getRandomInt,
  getRandomFloatInRange,
  calculateEquipmentScore,
}

export default boss

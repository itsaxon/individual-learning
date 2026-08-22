/**
 * 成就检测 — 移植自 plugins/achievementChecker.js
 */
import type { Achievement, Player } from './types'
import achievement from './achievement'

/** 检查条件是否达成 */
const checkCondition = (
  condition: Record<string, number | undefined>,
  data: Record<string, number | undefined>,
): boolean => {
  for (const [key, value] of Object.entries(condition)) {
    if (value === undefined) continue
    if (data[key] === undefined || (data[key] as number) < value) return false
  }
  return true
}

/** 检查玩家成就，返回新达成的成就列表（同时写入玩家数据） */
export const checkAchievements = (
  player: Player,
  type: 'pet' | 'monster' | 'equipment',
  data?: Record<string, number | undefined>,
): Achievement[] => {
  const newAchievements: Achievement[] = []
  switch (type) {
    case 'pet':
      checkPetAchievements(player, data || {}, newAchievements)
      break
    case 'monster':
      checkMonsterAchievements(player, newAchievements)
      break
    case 'equipment':
      checkEquipmentAchievements(player, data || {}, newAchievements)
      break
  }
  return newAchievements
}

const checkPetAchievements = (
  player: Player,
  pet: Record<string, number | undefined>,
  newAchievements: Achievement[],
) => {
  const petAchievements = achievement.pet()
  petAchievements.forEach((item) => {
    if (!player.achievement.pet.find((i) => i.id === item.id) && checkCondition(item.condition, pet)) {
      newAchievements.push(item)
      player.achievement.pet.push({ id: item.id })
      player.props.cultivateDan += item.award
    }
  })
}

const checkMonsterAchievements = (player: Player, newAchievements: Achievement[]) => {
  const monsterAchievements = achievement.monster()
  const playerData: Record<string, number | undefined> = {
    highestTowerFloor: player.highestTowerFloor,
    age: player.age,
    gameWins: player.gameWins,
  }
  monsterAchievements.forEach((item) => {
    if (!player.achievement.monster.find((i) => i.id === item.id) && checkCondition(item.condition, playerData)) {
      newAchievements.push(item)
      player.achievement.monster.push({ id: item.id })
      player.props.cultivateDan += item.award
    }
  })
}

const checkEquipmentAchievements = (
  player: Player,
  equipmentData: Record<string, number | undefined>,
  newAchievements: Achievement[],
) => {
  const equipmentAchievements = achievement.equipment()
  equipmentAchievements.forEach((item) => {
    if (!player.achievement.equipment.find((i) => i.id === item.id) && checkCondition(item.condition, equipmentData)) {
      newAchievements.push(item)
      player.achievement.equipment.push({ id: item.id })
      player.props.cultivateDan += item.award
    }
  })
}

export default checkAchievements

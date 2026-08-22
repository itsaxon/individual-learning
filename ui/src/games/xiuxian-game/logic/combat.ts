/**
 * 战斗系统 — 移植自 plugins/combat.js
 */
import type { Combatant, CombatRoundResult } from './types'

export const combat = {
  /** 计算单次伤害 */
  calculateDamage(attacker: Combatant, defender: Combatant): {
    damage: number
    isCritical: boolean
    isHit: boolean
  } {
    // 基础伤害计算
    let damage = Math.max(0, Math.floor(attacker.attack - defender.defense))
    damage = damage <= 1 ? 1 : damage
    // 闪避判定
    const isHit = Math.random() > defender.dodge
    if (!isHit) return { damage: 0, isCritical: false, isHit: false }
    // 暴击判定
    let isCritical = false
    if (Math.random() < attacker.critical) {
      damage *= 1.5
      isCritical = true
    }
    return { damage, isCritical, isHit: true }
  },

  /** 执行一回合战斗（攻击方攻击防守方） */
  executeCombatRound(attacker: Combatant, defender: Combatant): CombatRoundResult {
    const attackResult = this.calculateDamage(attacker, defender)
    if (attackResult.isHit) {
      defender.health = Math.max(0, defender.health - attackResult.damage)
    }
    return {
      damage: attackResult.damage,
      isCritical: attackResult.isCritical,
      isHit: attackResult.isHit,
      remainingHealth: defender.health,
    }
  },
}

export default combat

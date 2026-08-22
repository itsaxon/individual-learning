/**
 * EndlessPage — 无尽塔
 *
 * 移植自 views/endlessPage.vue。
 * 每层生成一只怪物进行单回合快速战斗；层数越高奖励越多。
 *
 * 简化点：原版有"自动战斗/扫荡"两种模式，这里合并为一个连续战斗按钮。
 */
import { useEffect, useRef, useState } from 'react'
import { Swords, Home, Layers, Trophy, ChevronUp } from 'lucide-react'
import { useGame } from '../logic/store'
import type { Monster } from '../logic/types'
import {
  formatNumberToChineseUnit, levelNames,
} from '../logic/game'
import { monster as monsterLogic } from '../logic/monster'
import { checkAchievements } from '../logic/achievementChecker'
import {
  Button, Panel, ProgressBar, ScrollableLog, useConfirm,
} from './ui'

export default function EndlessPage() {
  const { state, dispatch, notify } = useGame()
  const player = state.player
  const [texts, setTexts] = useState<string[]>([
    `欢迎来到无尽塔，当前层数：${player.highestTowerFloor}`,
  ])
  const [isRunning, setIsRunning] = useState(false)
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null)
  const [rounds, setRounds] = useState(0)
  const timerRef = useRef<number | null>(null)
  const { confirm, dialog } = useConfirm()

  const addText = (t: string) => setTexts((prev) => [...prev.slice(-100), t])

  /** 生成当前层怪物 */
  const spawnFloorMonster = (floor: number): Monster => {
    const lv = Math.max(1, floor)
    return monsterLogic.generate(lv)
  }

  /** 单回合战斗 */
  const fightOneRound = () => {
    if (!currentMonster) return
    const m = currentMonster
    // 玩家攻击
    let playerHarm = Math.max(1, Math.floor(player.attack - m.defense))
    const isPHit = Math.random() > m.dodge
    let isPCrit = false
    if (isPHit && Math.random() < player.critical) {
      playerHarm *= 1.5
      isPCrit = true
    }
    const newMonsterHealth = isPHit ? Math.max(0, m.health - playerHarm) : m.health
    setCurrentMonster({ ...m, health: newMonsterHealth })

    if (newMonsterHealth <= 0) {
      // 胜利
      addText(`<span style="color:#fbbf24">第 ${player.highestTowerFloor} 层通关！</span>`)
      const newFloor = player.highestTowerFloor + 1
      const reward = Math.floor(newFloor * 100)
      const rewardRewarded = !player.rewardedTowerFloors.includes(player.highestTowerFloor)
      const updates: Partial<typeof player> = {
        highestTowerFloor: newFloor,
        taskNum: player.taskNum + 1,
        props: {
          ...player.props,
          money: player.props.money + reward,
          cultivateDan: player.props.cultivateDan + (rewardRewarded ? 1 : 0),
        },
      }
      if (rewardRewarded) {
        updates.rewardedTowerFloors = [...player.rewardedTowerFloors, player.highestTowerFloor]
      }
      dispatch({ type: 'UPDATE_PLAYER', payload: updates })
      // 生成下一层怪物
      const next = spawnFloorMonster(newFloor)
      setCurrentMonster(next)
      setRounds((r) => r + 1)
      // 检查成就
      const newAch = checkAchievements(player, 'monster')
      newAch.forEach((a) => notify('获得成就', `恭喜你完成了 ${a.name} 成就`))
      return
    }

    // 怪物反击
    let monsterHarm = Math.max(1, Math.floor(m.attack - player.defense))
    const isMHit = Math.random() > player.dodge
    let isMCrit = false
    if (isMHit && Math.random() < m.critical) {
      monsterHarm *= 2
      isMCrit = true
    }
    const newPlayerHealth = isMHit ? Math.max(0, player.health - monsterHarm) : player.health
    dispatch({ type: 'UPDATE_PLAYER', payload: { health: newPlayerHealth } })

    if (newPlayerHealth <= 0) {
      addText(`<span style="color:#f43f5e">你在第 ${player.highestTowerFloor} 层倒下了…</span>`)
      stopFight()
      return
    }

    addText(
      isPHit
        ? `你攻击${m.name}，${isPCrit ? '触发暴击' : ''}造成${playerHarm}伤害，剩余${newMonsterHealth}气血。`
        : `你攻击${m.name}，对方闪避了。`,
    )
    addText(
      isMHit
        ? `${m.name}反击，${isMCrit ? '触发暴击' : ''}造成${monsterHarm}伤害。`
        : `${m.name}反击，你闪避了。`,
    )
  }

  const startFight = () => {
    if (isRunning) return
    if (player.health <= 0) {
      notify('无法战斗', '请先回家疗伤')
      return
    }
    setIsRunning(true)
    if (!currentMonster) {
      setCurrentMonster(spawnFloorMonster(player.highestTowerFloor))
    }
    const zs = player.reincarnation * 10
    const time = zs >= 200 ? 100 : 300 - zs
    timerRef.current = window.setInterval(fightOneRound, time)
  }

  const stopFight = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRunning(false)
  }

  /** 重置到第 1 层 */
  const resetTower = () => {
    confirm(
      '重置无尽塔',
      '将重置到第 1 层并恢复满血，但保留已获得的奖励。确定继续吗？',
      () => {
        stopFight()
        dispatch({
          type: 'UPDATE_PLAYER',
          payload: {
            highestTowerFloor: 1,
            health: player.maxHealth,
          },
        })
        setCurrentMonster(spawnFloorMonster(1))
        setRounds(0)
        setTexts(['已重置到第 1 层，开始新的征程！'])
      },
    )
  }

  const goHome = () => {
    stopFight()
    dispatch({ type: 'UPDATE_PLAYER', payload: { health: player.maxHealth } })
    dispatch({ type: 'SET_PAGE', payload: 'home' })
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <Panel glow>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4 text-blue-400" />
            <span className="text-slate-500">无尽塔</span>
            <span className="font-bold text-blue-700">第 {player.highestTowerFloor} 层</span>
          </div>
          <Button size="sm" variant="ghost" onClick={goHome}>
            <Home className="h-3 w-3" /> 返回
          </Button>
        </div>
        {currentMonster && (
          <>
            <ProgressBar
              value={currentMonster.health}
              max={currentMonster.maxHealth || currentMonster.health}
              label={`${currentMonster.name} 气血`}
              color="rose"
            />
            <div className="mt-2">
              <ProgressBar value={player.health} max={player.maxHealth} label="你的气血" color="emerald" />
            </div>
          </>
        )}
        {isRunning && (
          <div className="mt-2 text-center text-xs text-blue-600/70">
            已战斗 {rounds} 回合
          </div>
        )}
      </Panel>

      <Panel>
        <ScrollableLog texts={texts} className="h-56" />
      </Panel>

      <Panel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button variant="primary" onClick={startFight} disabled={isRunning}>
            <Swords className="h-3.5 w-3.5" /> 开始挑战
          </Button>
          <Button variant="ghost" onClick={stopFight} disabled={!isRunning}>
            <ChevronUp className="h-3.5 w-3.5" /> 暂停
          </Button>
          <Button variant="violet" onClick={resetTower}>
            <Trophy className="h-3.5 w-3.5" /> 重置塔
          </Button>
          <Button variant="ghost" onClick={goHome}>
            <Home className="h-3.5 w-3.5" /> 回家疗伤
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          每层通关奖励：层数 × 100 灵石 + 培养丹
        </p>
      </Panel>

      {dialog}
    </div>
  )
}

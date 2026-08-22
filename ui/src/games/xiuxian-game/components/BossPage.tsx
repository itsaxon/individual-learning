/**
 * BossPage — 世界 Boss 战
 *
 * 移植自 views/bossPage.vue。
 * 50 回合的 Boss 战，胜利后获得顶级装备 + 鸿蒙石 + 悟性丹。
 */
import { useEffect, useRef, useState } from 'react'
import { Swords, Crown, Home, RefreshCw, Skull } from 'lucide-react'
import { useGame } from '../logic/store'
import type { Boss, Equipment } from '../logic/types'
import {
  formatNumberToChineseUnit, genre, levelNames,
} from '../logic/game'
import { boss as bossLogic } from '../logic/boss'
import {
  Button, Modal, Panel, ProgressBar, ScrollableLog, Tag, qualityText, useConfirm,
} from './ui'

const MAX_ROUNDS = 50

export default function BossPage() {
  const { state, dispatch, notify } = useGame()
  const player = state.player
  const [texts, setTexts] = useState<string[]>([
    state.boss.name
      ? `世界 Boss <span style="color:#f43f5e">${state.boss.name}</span> 已现身！`
      : '尚未挑战 Boss，召唤一位吧。',
  ])
  const [isFighting, setIsFighting] = useState(false)
  const [isEnd, setIsEnd] = useState(false)
  const [victory, setVictory] = useState(false)
  const [rounds, setRounds] = useState(MAX_ROUNDS)
  const [lootItem, setLootItem] = useState<Equipment | null>(null)
  const timerRef = useRef<number | null>(null)
  const { confirm, dialog } = useConfirm()

  const addText = (t: string) => setTexts((prev) => [...prev.slice(-80), t])

  /** 召唤 Boss */
  const summonBoss = () => {
    const lv = Math.max(1, player.level)
    const newBoss = bossLogic.drawPrize(lv)
    dispatch({ type: 'SET_BOSS', payload: newBoss })
    setTexts([
      `世界 Boss <span style="color:#f43f5e">${newBoss.name}</span> 降临！`,
      `<span style="color:#a78bfa">${newBoss.text}</span>`,
    ])
    setIsEnd(false)
    setVictory(false)
    setRounds(MAX_ROUNDS)
  }

  const fightRound = () => {
    const boss = state.boss
    if (!boss || !boss.name || boss.health <= 0) {
      stopFight()
      return
    }
    let bossHarm = Math.max(1, Math.floor(boss.attack - player.defense))
    let playerHarm = Math.max(1, Math.floor(player.attack - boss.defense))
    const isPHit = Math.random() > boss.dodge
    const isMHit = Math.random() > player.dodge
    let isMCrit = false
    let isPCrit = false
    if (Math.random() < boss.critical) {
      bossHarm *= 2
      isMCrit = true
    }
    if (Math.random() < player.critical) {
      playerHarm *= 1.5
      isPCrit = true
    }
    const newBossHealth = isPHit ? Math.max(0, boss.health - playerHarm) : boss.health
    const newPlayerHealth = isMHit ? Math.max(0, player.health - bossHarm) : player.health
    dispatch({ type: 'SET_BOSS', payload: { ...boss, health: newBossHealth } })
    dispatch({ type: 'UPDATE_PLAYER', payload: { health: newPlayerHealth } })

    if (newBossHealth <= 0) {
      addText(`<span style="color:#fbbf24">你击败了 ${boss.name}！获得无上荣耀！</span>`)
      handleVictory()
      return
    }
    if (newPlayerHealth <= 0) {
      addText('你被 Boss 击败了，回家疗伤吧。')
      stopFight()
      setIsEnd(true)
      return
    }
    addText(
      isPHit
        ? `你攻击了${boss.name}，${isPCrit ? '触发暴击' : ''}造成了${playerHarm}点伤害，剩余${newBossHealth}气血。`
        : `你攻击了${boss.name}，对方闪避了你的攻击。`,
    )
    addText(
      isMHit
        ? `${boss.name}攻击了你，${isMCrit ? '触发暴击' : ''}造成了${bossHarm}点伤害。`
        : `${boss.name}攻击了你，你闪避了对方的攻击。`,
    )
    setRounds((r) => {
      const newR = r - 1
      if (newR <= 0) {
        addText('50 回合结束, 你未能击败 Boss。')
        stopFight()
        setIsEnd(true)
        return MAX_ROUNDS
      }
      return newR
    })
  }

  const handleVictory = () => {
    setVictory(true)
    setIsEnd(true)
    stopFight()
    const boss = state.boss
    // Boss 掉落
    const loot = bossLogic.boss_Equip(boss.level)
    setLootItem(loot)
    addText(
      `<span style="color:#fbbf24">Boss 掉落：${loot.name}（${genre[loot.type]}）</span>`,
    )
    // 奖励
    const newInventory =
      player.inventory.length >= player.backpackCapacity
        ? player.inventory
        : [...player.inventory, loot]
    if (player.inventory.length >= player.backpackCapacity) {
      addText('背包已满，掉落装备自动丢弃')
    }
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: {
        inventory: newInventory,
        props: {
          ...player.props,
          currency: player.props.currency + 10,
          rootBone: player.props.rootBone + 1,
        },
        taskNum: player.taskNum + 1,
      },
    })
    notify('Boss 已征服', '获得 10 鸿蒙石 + 1 悟性丹 + 顶级装备')
    // 标记 boss 已被征服
    dispatch({ type: 'SET_BOSS', payload: { ...boss, conquer: true, health: 0 } })
  }

  const startFight = () => {
    if (isEnd || !state.boss.name) return
    setIsFighting(true)
    const zs = player.reincarnation * 10
    const time = zs >= 200 ? 100 : 300 - zs
    timerRef.current = window.setInterval(fightRound, time)
  }

  const stopFight = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsFighting(false)
  }

  const goHome = () => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { health: player.maxHealth } })
    dispatch({ type: 'SET_PAGE', payload: 'home' })
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const boss = state.boss

  return (
    <div className="flex flex-col gap-4">
      <Panel glow>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Crown className="h-4 w-4 text-rose-400" />
            <span className="text-slate-500">世界 Boss：</span>
            {boss.name ? (
              <span className="font-bold text-rose-700">{boss.name}</span>
            ) : (
              <span className="text-slate-500">未召唤</span>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'home' })}>
            <Home className="h-3 w-3" /> 返回
          </Button>
        </div>
        {boss.name ? (
          <>
            <p className="mb-2 text-xs italic text-violet-600/80">{boss.desc}</p>
            <p className="mb-2 text-xs text-slate-500">「{boss.text}」</p>
            <ProgressBar value={boss.health} max={boss.maxhealth || boss.health} label={`${boss.name} 气血`} color="rose" />
            <div className="mt-2">
              <ProgressBar value={player.health} max={player.maxHealth} label="你的气血" color="emerald" />
            </div>
            {isFighting && (
              <div className="mt-2 text-center text-xs text-blue-600/70">
                {rounds} 回合 / {MAX_ROUNDS} 回合
              </div>
            )}
          </>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">
            世界 Boss 未现身，点击下方按钮召唤一位
          </p>
        )}
      </Panel>

      <Panel>
        <ScrollableLog texts={texts} className="h-56" />
      </Panel>

      <Panel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button variant="primary" onClick={startFight} disabled={isFighting || isEnd || !boss.name}>
            <Swords className="h-3.5 w-3.5" /> 发起战斗
          </Button>
          <Button variant="ghost" onClick={stopFight} disabled={!isFighting}>
            <Skull className="h-3.5 w-3.5" /> 停止战斗
          </Button>
          <Button variant="violet" onClick={() => confirm('召唤新 Boss', '当前 Boss 将被替换，确定继续吗？', summonBoss)}>
            <RefreshCw className="h-3.5 w-3.5" /> 召唤 Boss
          </Button>
          <Button variant="ghost" onClick={goHome}>
            <Home className="h-3.5 w-3.5" /> 回家疗伤
          </Button>
        </div>
      </Panel>

      {/* Boss 详情 */}
      {boss.name && (
        <Panel>
          <div className="mb-2 text-xs font-bold text-rose-700">Boss 属性</div>
          <div className="grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-3">
            <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
              <span className="text-slate-500">境界</span>：{levelNames(boss.level)}
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
              <span className="text-slate-500">气血</span>：{formatNumberToChineseUnit(boss.health)}
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
              <span className="text-slate-500">攻击</span>：{formatNumberToChineseUnit(boss.attack)}
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
              <span className="text-slate-500">防御</span>：{formatNumberToChineseUnit(boss.defense)}
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
              <span className="text-slate-500">闪避率</span>：{(boss.dodge * 100).toFixed(2)}%
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
              <span className="text-slate-500">暴击率</span>：{(boss.critical * 100).toFixed(2)}%
            </div>
          </div>
        </Panel>
      )}

      {/* 掉落物 */}
      {lootItem && (
        <Modal
          open={!!lootItem}
          title="Boss 掉落"
          onClose={() => setLootItem(null)}
          footer={
            <Button size="sm" variant="primary" onClick={() => setLootItem(null)}>收下</Button>
          }
        >
          <div className="space-y-2 text-xs">
            <Tag quality={lootItem.quality}>
              {qualityText[lootItem.quality]} · {genre[lootItem.type]}
            </Tag>
            <div className="font-bold text-blue-700">{lootItem.name}</div>
            <div>境界：{levelNames(lootItem.level)}</div>
            <div>评分：{formatNumberToChineseUnit(lootItem.score)}</div>
            {lootItem.attack > 0 && <div>攻击：{formatNumberToChineseUnit(lootItem.attack)}</div>}
            {lootItem.health > 0 && <div>气血：{formatNumberToChineseUnit(lootItem.health)}</div>}
            {lootItem.defense > 0 && <div>防御：{formatNumberToChineseUnit(lootItem.defense)}</div>}
            {lootItem.dodge > 0 && <div>闪避率：{(lootItem.dodge * 100).toFixed(2)}%</div>}
            {lootItem.critical > 0 && <div>暴击率：{(lootItem.critical * 100).toFixed(2)}%</div>}
          </div>
        </Modal>
      )}

      {dialog}
    </div>
  )
}

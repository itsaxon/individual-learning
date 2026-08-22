/**
 * ExplorePage — 探索战斗页
 *
 * 移植自 views/explorePage.vue。
 * 玩家与随机怪物进行 10 回合战斗，胜利后获得装备/培养丹，可收服为灵宠。
 *
 * 简化点：原版从地图进入并需要 mapData；这里直接生成怪物。
 */
import { useEffect, useRef, useState } from 'react'
import { Swords, Heart, Footprints, FastForward, Home, Map as MapIcon, Dna } from 'lucide-react'
import { useGame } from '../logic/store'
import type { Equipment, EquipType, Monster, Player } from '../logic/types'
import {
  formatNumberToChineseUnit, genre, getRandomFloatInRange, getRandomInt,
  levelNames, levels, maxLv,
} from '../logic/game'
import { monster as monsterLogic } from '../logic/monster'
import { equip as equipLogic } from '../logic/equip'
import { calculateEquipmentScore } from '../logic/equip'
import { achievement } from '../logic/achievement'
import {
  Button, Modal, Panel, ProgressBar, ScrollableLog, Tag, qualityText, useConfirm,
} from './ui'

export default function ExplorePage() {
  const { state, dispatch, notify } = useGame()
  const player = state.player
  const [monster, setMonster] = useState<Monster>(() => spawnMonster(player.level))
  const [texts, setTexts] = useState<string[]>([
    `你遇到了 <span style="color:#fb7185">${monster.name}</span>，准备战斗！`,
  ])
  const [isFighting, setIsFighting] = useState(false)
  const [isEnd, setIsEnd] = useState(false)
  const [rounds, setRounds] = useState(10)
  const [victory, setVictory] = useState(false)
  const [captureFailed, setCaptureFailed] = useState(false)
  const [retreatFailed, setRetreatFailed] = useState(false)
  const [monsterInfo, setMonsterInfo] = useState(false)
  const [lootItem, setLootItem] = useState<Equipment | null>(null)
  const timerRef = useRef<number | null>(null)
  const { confirm, dialog } = useConfirm()

  const addText = (t: string) => setTexts((prev) => [...prev.slice(-80), t])

  function spawnMonster(lv: number): Monster {
    return monsterLogic.generate(Math.max(1, lv))
  }

  /** 计算收服成功率 */
  const calculateCaptureRate = () => {
    const baseRate = 100
    const decay = 0.98
    return Math.floor(Math.max(0, Math.min(100, baseRate * Math.pow(decay, player.level))))
  }

  const fightRound = () => {
    if (monster.health <= 0) {
      stopFight()
      return
    }
    // 伤害计算
    let monsterHarm = Math.max(1, Math.floor(monster.attack - player.defense))
    let playerHarm = Math.max(1, Math.floor(player.attack - monster.defense))
    const isPHit = Math.random() > monster.dodge
    const isMHit = Math.random() > player.dodge
    let isMCritical = false
    let isCritical = false
    if (Math.random() < monster.critical) {
      monsterHarm *= 2
      isMCritical = true
    }
    if (Math.random() < player.critical) {
      playerHarm *= 1.5
      isCritical = true
    }
    const newMonsterHealth = isPHit ? Math.max(0, monster.health - playerHarm) : monster.health
    const newPlayerHealth = isMHit ? Math.max(0, player.health - monsterHarm) : player.health

    setMonster((m) => ({ ...m, health: newMonsterHealth }))
    dispatch({ type: 'UPDATE_PLAYER', payload: { health: newPlayerHealth } })

    if (newMonsterHealth <= 0) {
      addText(`你击败了 ${monster.name}！`)
      handleVictory()
      return
    }
    if (newPlayerHealth <= 0) {
      addText('你因为太弱被击败了。')
      stopFight()
      return
    }

    addText(
      !isPHit
        ? `你攻击了${monster.name}，对方闪避了你的攻击，你未造成伤害，剩余${newMonsterHealth}气血。`
        : `你攻击了${monster.name}，${isCritical ? '触发暴击' : ''}造成了${playerHarm}点伤害，剩余${newMonsterHealth}气血。`,
    )
    addText(
      !isMHit
        ? `${monster.name}攻击了你，你闪避了对方的攻击，对方未造成伤害。`
        : `${monster.name}攻击了你，${isMCritical ? '触发暴击' : ''}造成了${monsterHarm}点伤害。`,
    )

    setRounds((r) => {
      const newR = r - 1
      if (newR <= 0) {
        addText(`回合结束, 你未战胜 ${monster.name} 你输了。`)
        stopFight()
        return 10
      }
      return newR
    })
  }

  const handleVictory = () => {
    setVictory(true)
    setIsEnd(true)
    stopFight()
    // 增加击杀数与培养丹
    const reincarnation = player.reincarnation ? 1 + player.reincarnation : 1
    const newTaskNum = player.taskNum + 1
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: {
        taskNum: newTaskNum,
        props: {
          ...player.props,
          cultivateDan: player.props.cultivateDan + reincarnation,
        },
      },
    })
    addText(`击败${monster.name}后你获得了${reincarnation}颗培养丹`)
    // 掉落装备
    findTreasure()
    // 修为增加 / 突破
    grantExp()
  }

  const findTreasure = () => {
    const randomInt = getRandomInt(1, 4)
    let item: Equipment
    if (randomInt === 1) item = equipLogic.equip_Weapons(player.level)
    else if (randomInt === 2) item = equipLogic.equip_Armors(player.level)
    else if (randomInt === 3) item = equipLogic.equip_Accessorys(player.level)
    else item = equipLogic.equip_Sutras(player.level)
    addText(
      `你击败${monster.name}后，发现了一个宝箱，打开后获得了<span style="color:#fbbf24">${levels[item.quality]}${item.name}(${genre[item.type]})</span>`,
    )
    setLootItem(item)
    if (player.inventory.length >= player.backpackCapacity) {
      addText('当前装备背包容量已满, 该装备自动丢弃, 转生可增加背包容量')
    } else {
      dispatch({
        type: 'UPDATE_PLAYER',
        payload: { inventory: [...player.inventory, item] },
      })
    }
  }

  const grantExp = () => {
    if (player.level >= maxLv) return
    const exp = Math.max(1, Math.floor(player.maxCultivation / 100))
    if (player.cultivation + exp >= player.maxCultivation) {
      if (player.level > 10 && player.level > player.taskNum) {
        addText(
          `当前境界修为已满, 你需要通过击败<span style="color:#fbbf24">(${player.taskNum} / ${player.level})</span>个敌人证道突破`,
        )
        return
      }
      const newLevel = player.level + 1
      dispatch({
        type: 'UPDATE_PLAYER',
        payload: {
          taskNum: 0,
          level: newLevel,
          points: player.points + 3,
          health: player.maxHealth,
          maxCultivation: Math.floor(100 * Math.pow(2, newLevel)),
        },
      })
      addText(`恭喜你突破了！当前境界：${levelNames(newLevel)}`)
    } else {
      dispatch({ type: 'UPDATE_PLAYER', payload: { cultivation: player.cultivation + exp } })
    }
  }

  const startFight = () => {
    if (isEnd) return
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
    setCaptureFailed(true)
    setRetreatFailed(true)
  }

  const runAway = () => {
    setRounds((r) => {
      const newR = r - 1
      if (getRandomInt(0, 1)) {
        setRetreatFailed(true)
        addText('撤退失败，继续战斗。')
        return newR
      } else {
        stopFight()
        notify('提示', '你选择了撤退。')
        setIsEnd(true)
        return 10
      }
    })
  }

  const harvestPet = () => {
    setCaptureFailed(true)
    const successRate = calculateCaptureRate()
    const isSuccess = successRate >= getRandomInt(1, 100)
    if (isSuccess) {
      if (player.backpackCapacity > player.pets.length) {
        const newProperties = Math.floor((100 - successRate) * 0.5)
        const attack = Math.floor(getRandomInt(50, 150) * newProperties)
        const defense = Math.floor(getRandomInt(1, 15) * newProperties)
        const health = Math.floor(getRandomInt(100, 500) * newProperties)
        const dodge = parseFloat((getRandomFloatInRange(0.001, 0.01) * newProperties).toFixed(4))
        const critical = parseFloat((getRandomFloatInRange(0.001, 0.01) * newProperties).toFixed(4))
        const newPet = {
          id: Date.now(),
          lock: false,
          name: monster.name,
          level: 1,
          score: calculateEquipmentScore(dodge, attack, health, critical, defense),
          dodge,
          health,
          attack,
          defense,
          critical,
          initial: { dodge, health, attack, defense, critical, rootBone: newProperties },
          rootBone: newProperties,
          favorability: 0,
          reincarnation: 0,
        }
        const newPets = [...player.pets, newPet]
        dispatch({ type: 'UPDATE_PLAYER', payload: { pets: newPets } })
        // 成就检测
        const newAch = achievement.pet().filter(
          (a) =>
            !player.achievement.pet.find((p) => p.id === a.id) &&
            (a.condition.health === 0 || (a.condition.health || 0) <= health) &&
            (a.condition.attack === 0 || (a.condition.attack || 0) <= attack) &&
            (a.condition.defense === 0 || (a.condition.defense || 0) <= defense) &&
            (a.condition.dodge === 0 || (a.condition.dodge || 0) <= parseFloat(dodge.toFixed(2))) &&
            (a.condition.critical === 0 || (a.condition.critical || 0) <= parseFloat(critical.toFixed(2))),
        )
        if (newAch.length) {
          const newAchIds = newAch.map((a) => ({ id: a.id }))
          dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
              achievement: {
                ...player.achievement,
                pet: [...player.achievement.pet, ...newAchIds],
              },
              props: {
                ...player.props,
                cultivateDan: player.props.cultivateDan + newAch.reduce((s, a) => s + a.award, 0),
              },
            },
          })
          newAch.forEach((a) => notify('获得成就', `恭喜你完成了 ${a.name} 成就`))
        }
        addText(`收服${monster.name}成功`)
        setRounds(10)
        stopFight()
        setIsEnd(true)
      } else {
        addText(`灵宠背包容量已满, 收服${monster.name}失败, 转生可增加灵宠背包容量`)
      }
    } else {
      addText(`收服${monster.name}失败`)
    }
  }

  const continueExplore = () => {
    // 与 vue 版本一致：返回探索地图，让玩家自主选择下一个目标
    dispatch({ type: 'SET_PAGE', payload: 'map' })
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

  return (
    <div className="flex flex-col gap-4">
      <Panel glow>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-slate-500">你遇到了：</span>
            <button
              onClick={() => setMonsterInfo(true)}
              className="font-bold text-rose-700 hover:text-rose-800"
            >
              {monster.name}
            </button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'map' })}>
            <MapIcon className="h-3 w-3" /> 返回地图
          </Button>
        </div>
        <ProgressBar value={monster.health} max={monster.maxHealth || monster.health} label={`${monster.name} 气血`} color="rose" />
        <div className="mt-2">
          <ProgressBar value={player.health} max={player.maxHealth} label="你的气血" color="emerald" />
        </div>
        {isFighting && (
          <div className="mt-2 text-center text-xs text-blue-600/70">
            {rounds} 回合 / 10 回合
          </div>
        )}
      </Panel>

      <Panel>
        <ScrollableLog texts={texts} className="h-56" />
      </Panel>

      <Panel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button variant="primary" onClick={startFight} disabled={isEnd || isFighting}>
            <Swords className="h-3.5 w-3.5" /> 发起战斗
          </Button>
          <Button variant="violet" onClick={harvestPet} disabled={isEnd || captureFailed}>
            <Dna className="h-3.5 w-3.5" /> 收服对方
          </Button>
          <Button variant="ghost" onClick={runAway} disabled={isEnd || retreatFailed}>
            <FastForward className="h-3.5 w-3.5" /> 立马撤退
          </Button>
          {isEnd && (
            <Button variant="gold" onClick={continueExplore}>
              <Footprints className="h-3.5 w-3.5" /> 继续探索
            </Button>
          )}
          {isEnd && (
            <Button variant="ghost" onClick={goHome}>
              <Home className="h-3.5 w-3.5" /> 回家疗伤
            </Button>
          )}
          {isEnd && victory && (
            <Button variant="ghost" onClick={() => lootItem && setMonsterInfo(false)}>
              <Heart className="h-3.5 w-3.5" /> 战斗结束
            </Button>
          )}
        </div>
      </Panel>

      {/* 怪物信息 */}
      <Modal
        open={monsterInfo}
        title={monster.name}
        onClose={() => setMonsterInfo(false)}
      >
        <div className="space-y-1.5 text-xs">
          <div>境界：{levelNames(player.level === 0 ? 1 : player.level)}</div>
          <div>气血：{formatNumberToChineseUnit(monster.health)}</div>
          <div>攻击：{formatNumberToChineseUnit(monster.attack)}</div>
          <div>防御：{formatNumberToChineseUnit(monster.defense)}</div>
          <div>闪避率：{(monster.dodge * 100).toFixed(2)}%</div>
          <div>暴击率：{(monster.critical * 100).toFixed(2)}%</div>
          <div>收服率：{calculateCaptureRate()}%</div>
        </div>
      </Modal>

      {/* 掉落物品 */}
      {lootItem && (
        <Modal
          open={!!lootItem}
          title="战利品"
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

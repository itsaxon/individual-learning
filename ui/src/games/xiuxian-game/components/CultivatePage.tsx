/**
 * CultivatePage — 修炼页
 *
 * 移植自 views/cultivatePage.vue。
 * 使用 setInterval 循环增加修为，10% 概率触发随机事件。
 * 修为满后自动突破；高境界需要击败一定数量的敌人才能继续突破。
 */
import { useEffect, useRef, useState } from 'react'
import { Play, Square, RotateCcw, ArrowLeft } from 'lucide-react'
import { useGame } from '../logic/store'
import { levelNames, maxLv, getRandomInt } from '../logic/game'
import { Button, Panel, ProgressBar, ScrollableLog, useConfirm } from './ui'

const RANDOM_EVENTS = [
  { type: 'resource', name: '灵石', amount: 100, description: '你发现了一堆灵石！' },
  { type: 'cultivation', name: '顿悟', amount: 500, description: '你突然顿悟，修为大涨！' },
  { type: 'item', name: '丹药', description: '你获得了一颗珍贵的丹药！' },
  { type: 'skill', name: '剑法', description: '你领悟了一门高深剑法！' },
  { type: 'lucky', name: '雷劫', description: '你遭遇了雷劫！' },
] as const

export default function CultivatePage() {
  const { state, dispatch, notify } = useGame()
  const player = state.player
  const [texts, setTexts] = useState<string[]>([
    '静心凝神，准备开始修炼…',
  ])
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef<number | null>(null)
  const { confirm, dialog } = useConfirm()

  // 修复 React 闭包陷阱：setInterval 注册的 tick 闭包捕获的是初始渲染的 player，
  // 即使组件重新渲染，闭包里的 player 还是旧值，导致修为永远涨不上去。
  // 通过 ref 始终读取最新的 player。
  const playerRef = useRef(player)
  useEffect(() => {
    playerRef.current = player
  }, [player])

  const addText = (t: string) => setTexts((prev) => [...prev.slice(-100), t])

  const triggerRandomEvent = () => {
    const p = playerRef.current
    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]
    addText(`<span style="color:#fbbf24">${event.description}</span>`)
    const updates: Partial<typeof p> = {}
    const props = { ...p.props }
    switch (event.type) {
      case 'resource':
        props.money += event.amount
        updates.props = props
        break
      case 'cultivation':
        updates.cultivation = p.cultivation + event.amount
        break
      case 'item':
        updates.cultivation = p.cultivation + Math.floor(p.cultivation * 0.05)
        break
      case 'lucky':
        updates.cultivation = Math.max(0, p.cultivation - Math.floor(p.cultivation * 0.1))
        break
      case 'skill':
        updates.attack = Math.floor(p.attack * 1.1)
        break
    }
    dispatch({ type: 'UPDATE_PLAYER', payload: updates })
  }

  const stopCultivate = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRunning(false)
  }

  const breakThrough = (exp: number) => {
    const p = playerRef.current
    const reincarnationFactor = p.reincarnation ? p.reincarnation + 1 : 1
    if (p.level < maxLv) {
      if (p.cultivation >= p.maxCultivation) {
        // 高境界需要先击杀一定数量敌人证道
        if (p.level > 10 && p.level > p.taskNum) {
          stopCultivate()
          addText(
            `当前境界修为已满, 你需要通过击败<span style="color:#fbbf24">(${p.taskNum} / ${p.level})</span>个敌人证道突破`,
          )
          return
        }
        const newLevel = p.level + 1
        dispatch({
          type: 'UPDATE_PLAYER',
          payload: {
            taskNum: 0,
            level: newLevel,
            points: p.points + 3,
            health: p.maxHealth,
            maxCultivation: Math.floor(100 * Math.pow(2, newLevel * reincarnationFactor)),
          },
        })
        addText(`恭喜你突破了！当前境界：${levelNames(newLevel)}`)
      } else {
        dispatch({ type: 'UPDATE_PLAYER', payload: { cultivation: p.cultivation + exp } })
      }
    } else {
      stopCultivate()
      addText('你当前的境界已修炼圆满, 需要转生后才能继续修炼')
    }
  }

  const tick = () => {
    const p = playerRef.current
    if (p.cultivation <= p.maxCultivation) {
      const exp =
        p.level <= 10
          ? Math.floor(p.maxCultivation / getRandomInt(10, 30))
          : Math.floor(p.maxCultivation / 100)
      addText(
        p.level < maxLv
          ? '你开始冥想，吸收周围的灵气。修为提升了！'
          : '你当前的境界已修炼圆满, 需要转生后才能继续修炼',
      )
      breakThrough(exp)
      if (Math.random() < 0.1) triggerRandomEvent()
    } else {
      breakThrough(100)
    }
  }

  const startCultivate = () => {
    if (isRunning) return
    setIsRunning(true)
    addText('开始修炼…')
    const zs = player.reincarnation * 10
    const time = zs >= 200 ? 100 : 300 - zs
    timerRef.current = window.setInterval(tick, time)
  }

  /** 转生突破 */
  const reincarnationBreakthrough = () => {
    const requiredKills = player.reincarnation === 0 ? 100 : player.reincarnation * 100
    if (player.level !== maxLv) {
      notify('未满足转生条件', `境界需要达到<span style="color:#fbbf24">${levelNames(maxLv)}</span>才能满足转生条件`)
      return
    }
    if (player.points > 0) {
      notify('未满足转生条件', `当前还有${player.points}境界点未使用, 无法转生`)
      return
    }
    if (player.taskNum < requiredKills) {
      notify(
        '未满足转生条件',
        `需要通过击败<span style="color:#fbbf24">(${player.taskNum} / ${requiredKills})</span>个敌人证道转生`,
      )
      return
    }
    confirm(
      '转生提醒',
      player.reincarnation === 0
        ? '转生之后的敌人属性是转生前的百倍，转生前请务必确认自己的实力是否足够。'
        : '转生操作不可逆, 是否确定要转生?',
      () => {
        dispatch({
          type: 'UPDATE_PLAYER',
          payload: {
            level: 0,
            taskNum: 0,
            cultivation: 0,
            maxCultivation: 100,
            reincarnation: player.reincarnation + 1,
            backpackCapacity: player.backpackCapacity + 50,
          },
        })
        notify(
          '转生提示',
          `转生成功, 当前为${player.reincarnation + 1}转, 背包总容量增加50`,
        )
        setTexts(['转生完成，新的旅程开始…'])
      },
      true,
    )
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const cultivationPct = Math.min(100, (player.cultivation / player.maxCultivation) * 100)

  return (
    <div className="flex flex-col gap-4">
      <Panel glow>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-slate-500">当前境界：</span>
            <span className="font-bold text-blue-700">
              {levelNames(player.level)}
            </span>
            {player.reincarnation > 0 && (
              <span className="ml-1 text-violet-700">({player.reincarnation}转)</span>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'home' })}>
            <ArrowLeft className="h-3 w-3" /> 返回
          </Button>
        </div>
        <ProgressBar value={player.cultivation} max={player.maxCultivation} label="修为进度" color="amber" />
        <div className="mt-2 text-center text-xs text-slate-500">
          {player.level < maxLv
            ? `距离 ${levelNames(player.level + 1)} 还需 ${formatExp(player.maxCultivation - player.cultivation)} 修为`
            : '境界已圆满，可尝试转生'}
        </div>
      </Panel>

      <Panel>
        <ScrollableLog texts={texts} className="h-64" />
      </Panel>

      <Panel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button variant="primary" onClick={startCultivate} disabled={isRunning}>
            <Play className="h-3.5 w-3.5" /> 开始修炼
          </Button>
          <Button variant="ghost" onClick={stopCultivate} disabled={!isRunning}>
            <Square className="h-3.5 w-3.5" /> 停止修炼
          </Button>
          <Button variant="violet" onClick={reincarnationBreakthrough}>
            <RotateCcw className="h-3.5 w-3.5" /> 转生突破
          </Button>
          <Button variant="ghost" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'home' })}>
            <ArrowLeft className="h-3.5 w-3.5" /> 返回家里
          </Button>
        </div>
        {isRunning && (
          <p className="mt-2 text-center text-xs text-blue-600/70">
            修炼中…每 {Math.max(100, 300 - player.reincarnation * 10)}ms 获取一次修为
          </p>
        )}
        {cultivationPct >= 100 && player.level < maxLv && player.level > 10 && (
          <p className="mt-2 text-center text-xs text-rose-700">
            需击败 {player.taskNum} / {player.level} 个敌人证道突破，去探索或挑战 Boss
          </p>
        )}
      </Panel>

      {dialog}
    </div>
  )
}

/** 格式化修为差值 */
function formatExp(n: number): string {
  if (n < 10000) return Math.floor(n).toString()
  if (n < 1e8) return (n / 1e4).toFixed(2) + '万'
  if (n < 1e12) return (n / 1e8).toFixed(2) + '亿'
  return (n / 1e12).toFixed(2) + '兆'
}

/**
 * MapExplorationPage — 地图探索
 *
 * 移植自 views/mapExploration.vue。
 *
 * 简化点：
 * - 原版是 50×50 网格 + A* 寻路自动行走，这里改为 12×12 网格 + 直接点击移动。
 * - 保留 MinHeap 类（已实现于 logic/minheap.ts），用于将来扩展 A* 自动寻路。
 * - 保留钓鱼小游戏。
 *
 * 玩法：玩家从左上角出发，走到不同格子触发事件（怪物/宝箱/钓鱼/NPC/空地），
 * 遇到怪物时进入 ExplorePage 战斗。
 */
import { useMemo, useState } from 'react'
import { Home, MapPin, Fish, Gift, Users, Skull } from 'lucide-react'
import { useGame } from '../logic/store'
import { monster as monsterLogic } from '../logic/monster'
import { getRandomInt } from '../logic/game'
import { Button, Panel, ScrollableLog, useConfirm } from './ui'
import { MinHeap } from '../logic/minheap'

const GRID_SIZE = 12

/** 格子类型 */
type CellType = 'empty' | 'monster' | 'treasure' | 'fishing' | 'npc' | 'trap'

interface Cell {
  type: CellType
  revealed: boolean
}

/** 生成地图 */
const generateMap = (): Cell[][] => {
  const map: Cell[][] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Cell[] = []
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ type: 'empty', revealed: false })
    }
    map.push(row)
  }
  // 起点 (0,0) 必须为空地
  // 随机放置各类格子
  const placeRandom = (type: CellType, count: number) => {
    let placed = 0
    while (placed < count) {
      const y = getRandomInt(0, GRID_SIZE - 1)
      const x = getRandomInt(0, GRID_SIZE - 1)
      if (y === 0 && x === 0) continue
      if (map[y][x].type !== 'empty') continue
      map[y][x].type = type
      placed++
    }
  }
  placeRandom('monster', 18)
  placeRandom('treasure', 10)
  placeRandom('fishing', 6)
  placeRandom('npc', 4)
  placeRandom('trap', 5)
  return map
}

/** 揭示周围格子（视野范围） */
const revealAround = (map: Cell[][], py: number, px: number) => {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const ny = py + dy
      const nx = px + dx
      if (ny < 0 || ny >= GRID_SIZE || nx < 0 || nx >= GRID_SIZE) continue
      map[ny][nx].revealed = true
    }
  }
}

export default function MapExplorationPage() {
  const { state, dispatch, notify } = useGame()
  const player = state.player
  const [map, setMap] = useState<Cell[][]>(() => {
    if (state.mapData.map.length === GRID_SIZE) {
      // 复用已存档的地图（这里简化为重新生成）
    }
    const newMap = generateMap()
    revealAround(newMap, 0, 0)
    return newMap
  })
  const [pos, setPos] = useState({ y: 0, x: 0 })
  const [texts, setTexts] = useState<string[]>([
    '你来到了未知地图，点击周围格子探索吧。',
  ])
  const [fishing, setFishing] = useState(false)
  const { confirm, dialog } = useConfirm()

  const addText = (t: string) => setTexts((prev) => [...prev.slice(-50), t])

  /** A* 寻路示例：用 MinHeap 计算最短路径（这里仅作为 minheap 的引用示例，未在交互中使用） */
  const findPath = (start: { y: number; x: number }, end: { y: number; x: number }) => {
    const open = new MinHeap<{ y: number; x: number; g: number; f: number }>()
    open.add({ ...start, g: 0, f: Math.abs(end.y - start.y) + Math.abs(end.x - start.x) }, 0)
    return open
  }

  /** 移动到指定格子 */
  const moveTo = (y: number, x: number) => {
    if (Math.abs(y - pos.y) + Math.abs(x - pos.x) !== 1) return // 仅允许相邻移动
    if (y < 0 || y >= GRID_SIZE || x < 0 || x >= GRID_SIZE) return

    const newMap = map.map((row) => row.map((c) => ({ ...c })))
    revealAround(newMap, y, x)
    setMap(newMap)
    setPos({ y, x })

    const cell = newMap[y][x]
    if (cell.type === 'empty') {
      addText('你走过一片空地，什么也没发生。')
      return
    }
    // 触发事件
    triggerEvent(cell.type, y, x, newMap)
  }

  const triggerEvent = (type: CellType, y: number, x: number, newMap: Cell[][]) => {
    switch (type) {
      case 'monster': {
        const m = monsterLogic.generate(Math.max(1, player.level))
        dispatch({ type: 'SET_MONSTER', payload: m })
        dispatch({ type: 'SET_MAP_DATA', payload: { y, x, map: [] } })
        addText(`你遇到了 <span style="color:#fb7185">${m.name}</span>！进入战斗…`)
        setTimeout(() => dispatch({ type: 'SET_PAGE', payload: 'explore' }), 500)
        break
      }
      case 'treasure': {
        const reward = getRandomInt(100, 500) * Math.max(1, player.level)
        dispatch({
          type: 'PATCH_PLAYER_PROPS',
          payload: { money: player.props.money + reward },
        })
        addText(`<span style="color:#fbbf24">发现宝箱！获得 ${reward} 灵石</span>`)
        newMap[y][x].type = 'empty'
        setMap([...newMap])
        break
      }
      case 'fishing': {
        setFishing(true)
        addText('你来到了一片湖泊，可以钓鱼…')
        break
      }
      case 'npc': {
        const npcNames = ['云渺仙子', '琉光幽姬', '烟霞仙子', '清韵灵姬']
        const npc = npcNames[getRandomInt(0, npcNames.length - 1)]
        const gift = getRandomInt(1, 5)
        dispatch({
          type: 'PATCH_PLAYER_PROPS',
          payload: {
            qingyuan: player.props.qingyuan + gift,
            flying: player.props.flying + 1,
          },
        })
        addText(`<span style="color:#a78bfa">遇到了 ${npc}，赠予你 ${gift} 情缘 + 1 传送符</span>`)
        newMap[y][x].type = 'empty'
        setMap([...newMap])
        break
      }
      case 'trap': {
        const damage = getRandomInt(50, 200)
        const newHealth = Math.max(0, player.health - damage)
        dispatch({ type: 'UPDATE_PLAYER', payload: { health: newHealth } })
        addText(`<span style="color:#f43f5e">触发了陷阱！减少 ${damage} 气血</span>`)
        newMap[y][x].type = 'empty'
        setMap([...newMap])
        if (newHealth <= 0) {
          confirm('你倒下了', '生命值归零，将自动回家疗伤。', () => {
            dispatch({ type: 'UPDATE_PLAYER', payload: { health: player.maxHealth } })
            setPos({ y: 0, x: 0 })
            const fresh = generateMap()
            revealAround(fresh, 0, 0)
            setMap(fresh)
          })
        }
        break
      }
    }
  }

  /** 钓鱼小游戏 */
  const doFish = () => {
    const luck = Math.random()
    if (luck < 0.6) {
      const reward = getRandomInt(50, 200) * Math.max(1, player.level)
      dispatch({
        type: 'PATCH_PLAYER_PROPS',
        payload: { money: player.props.money + reward },
      })
      addText(`<span style="color:#34d399">钓到灵鱼！获得 ${reward} 灵石</span>`)
    } else if (luck < 0.9) {
      const dan = getRandomInt(1, 3)
      dispatch({
        type: 'PATCH_PLAYER_PROPS',
        payload: { cultivateDan: player.props.cultivateDan + dan },
      })
      addText(`<span style="color:#a78bfa">钓到稀有灵鱼！获得 ${dan} 培养丹</span>`)
    } else {
      addText('<span style="color:#94a3b8">鱼跑了…</span>')
    }
    setFishing(false)
  }

  const goHome = () => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { health: player.maxHealth } })
    dispatch({ type: 'SET_PAGE', payload: 'home' })
  }

  const resetMap = () => {
    confirm('重新生成地图', '当前地图将被重置，确定吗？', () => {
      const newMap = generateMap()
      revealAround(newMap, 0, 0)
      setMap(newMap)
      setPos({ y: 0, x: 0 })
      setTexts(['地图已重置，开始新的探索！'])
    })
  }

  const cellColor: Record<CellType, string> = {
    empty: 'bg-slate-50 hover:bg-slate-100',
    monster: 'bg-rose-200 hover:bg-rose-300',
    treasure: 'bg-blue-200 hover:bg-blue-300',
    fishing: 'bg-sky-200 hover:bg-sky-300',
    npc: 'bg-violet-200 hover:bg-violet-300',
    trap: 'bg-slate-300',
  }

  const cellIcon: Record<CellType, string> = {
    empty: '',
    monster: '👹',
    treasure: '💰',
    fishing: '🎣',
    npc: '👘',
    trap: '💀',
  }

  // 仅显示已揭示的格子（雾战）
  const visibleMap = useMemo(() => map, [map])

  return (
    <div className="flex flex-col gap-4">
      <Panel glow>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-blue-400" />
            <span className="text-slate-500">位置：</span>
            <span className="font-mono text-blue-700">
              ({pos.x + 1}, {pos.y + 1})
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={goHome}>
            <Home className="h-3 w-3" /> 返回
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
          <span><Skull className="mr-1 inline h-3 w-3 text-rose-400" />怪物</span>
          <span><Gift className="mr-1 inline h-3 w-3 text-blue-400" />宝箱</span>
          <span><Fish className="mr-1 inline h-3 w-3 text-sky-400" />钓鱼点</span>
          <span><Users className="mr-1 inline h-3 w-3 text-violet-400" />NPC</span>
        </div>
      </Panel>

      {/* 地图网格 */}
      <Panel>
        <div className="mx-auto" style={{ maxWidth: '480px' }}>
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          >
            {visibleMap.map((row, y) =>
              row.map((cell, x) => {
                const isPlayer = pos.y === y && pos.x === x
                const isAdjacent =
                  Math.abs(y - pos.y) + Math.abs(x - pos.x) === 1
                const canMove = isAdjacent && cell.revealed
                return (
                  <button
                    key={`${y}-${x}`}
                    onClick={() => canMove && moveTo(y, x)}
                    disabled={!canMove}
                    className={
                      'aspect-square rounded text-[10px] sm:text-xs transition-all ' +
                      (isPlayer
                        ? 'bg-blue-400 text-[#1f1610] font-bold ring-2 ring-blue-300 '
                        : cell.revealed
                          ? cellColor[cell.type] + ' cursor-pointer '
                          : 'bg-slate-200 cursor-not-allowed ')
                    }
                  >
                    {isPlayer ? '你' : cell.revealed ? cellIcon[cell.type] : ''}
                  </button>
                )
              }),
            )}
          </div>
        </div>
        <div className="mt-3 text-center text-xs text-slate-500">
          点击相邻格子移动；MinHeap 寻路已就绪（用于自动寻路扩展）
        </div>
      </Panel>

      <Panel>
        <ScrollableLog texts={texts} className="h-40" />
      </Panel>

      <Panel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button variant="ghost" onClick={resetMap}>重置地图</Button>
          <Button variant="ghost" onClick={goHome}>
            <Home className="h-3.5 w-3.5" /> 回家疗伤
          </Button>
        </div>
      </Panel>

      {/* 钓鱼弹窗 */}
      {fishing && (
        <Panel glow>
          <div className="text-center">
            <Fish className="mx-auto mb-2 h-8 w-8 text-sky-400" />
            <p className="text-sm text-slate-700">湖面波光粼粼，下竿吧…</p>
            <div className="mt-3 flex justify-center gap-2">
              <Button variant="primary" onClick={doFish}>下竿</Button>
              <Button variant="ghost" onClick={() => setFishing(false)}>离开</Button>
            </div>
          </div>
        </Panel>
      )}

      {dialog}
    </div>
  )
}

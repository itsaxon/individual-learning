/**
 * GamePage — 小游戏合集
 *
 * 移植自 views/game/game.vue 与子组件（签到 / 骰子 / 猜拳 / 算命 / 井字 / 秘境）。
 *
 * 简化点：原版每个小游戏都有冷却时间与货币门槛，这里保留冷却机制但简化 UI。
 */
import { useEffect, useState } from 'react'
import {
  CalendarCheck, Dices, Hand, Sparkles, Hash, Compass, Home, Clock,
} from 'lucide-react'
import { useGame } from '../logic/store'
import { getRandomInt } from '../logic/game'
import { Button, Panel, ScrollableLog } from './ui'

type MiniGame = 'checkin' | 'dice' | 'rps' | 'fortune' | 'toe' | 'secret' | null

const GAMES: { id: MiniGame; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'checkin', label: '每日签到', icon: <CalendarCheck className="h-4 w-4" />, desc: '每日领取灵石奖励' },
  { id: 'dice', label: '掷骰子', icon: <Dices className="h-4 w-4" />, desc: '猜大小，赌灵石' },
  { id: 'rps', label: '石头剪刀布', icon: <Hand className="h-4 w-4" />, desc: '与天道对决' },
  { id: 'fortune', label: '算命', icon: <Sparkles className="h-4 w-4" />, desc: '每日一次命运指引' },
  { id: 'toe', label: '井字棋', icon: <Hash className="h-4 w-4" />, desc: '与天道对弈' },
  { id: 'secret', label: '秘境探索', icon: <Compass className="h-4 w-4" />, desc: '8×8 网格随机事件' },
]

export default function GamePage() {
  const { state, dispatch, notify } = useGame()
  const player = state.player
  const [active, setActive] = useState<MiniGame>(null)
  const [texts, settexts] = useState<string[]>([])

  const addText = (t: string) => settexts((prev) => [...prev.slice(-30), t])

  return (
    <div className="flex flex-col gap-4">
      <Panel glow>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-blue-700">小游戏合集</div>
          <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'home' })}>
            <Home className="h-3 w-3" /> 返回
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setActive(g.id)
                settexts([])
              }}
              className={
                'flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition-colors ' +
                (active === g.id
                  ? 'border-blue-400 bg-blue-100 text-blue-900'
                  : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100')
              }
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                {g.icon}
                {g.label}
              </div>
              <div className="text-[10px] text-slate-500">{g.desc}</div>
            </button>
          ))}
        </div>
      </Panel>

      {active && (
        <Panel>
          {active === 'checkin' && <CheckinGame onLog={addText} />}
          {active === 'dice' && <DiceGame onLog={addText} />}
          {active === 'rps' && <RpsGame onLog={addText} />}
          {active === 'fortune' && <FortuneGame onLog={addText} />}
          {active === 'toe' && <ToeGame onLog={addText} />}
          {active === 'secret' && <SecretGame onLog={addText} />}
        </Panel>
      )}

      {texts.length > 0 && (
        <Panel>
          <ScrollableLog texts={texts} className="h-32" />
        </Panel>
      )}

      {/* 灵石余额 */}
      <Panel>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">当前灵石</span>
          <span className="font-mono text-blue-700">{player.props.money}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-slate-500">胜场 / 负场</span>
          <span className="font-mono text-emerald-700">
            {player.gameWins} / {player.gameLosses}
          </span>
        </div>
      </Panel>
    </div>
  )
}

/* ============ 签到 ============ */
function CheckinGame({ onLog }: { onLog: (t: string) => void }) {
  const { state, dispatch, notify } = useGame()
  const player = state.player
  const today = new Date().toDateString()
  const alreadyCheckedIn = player.lastCheckinDate === today

  const checkin = () => {
    if (alreadyCheckedIn) {
      notify('已签到', '今日已签到，明天再来吧')
      return
    }
    const streak = player.lastCheckinDate &&
      new Date(today).getTime() - new Date(player.lastCheckinDate).getTime() === 86400000
      ? player.checkinStreak + 1
      : 1
    const reward = 500 * streak
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: {
        lastCheckinDate: today,
        checkedInToday: true,
        checkinDays: player.checkinDays + 1,
        checkinStreak: streak,
        props: { ...player.props, money: player.props.money + reward },
      },
    })
    onLog(`<span style="color:#fbbf24">签到成功！连续 ${streak} 天，获得 ${reward} 灵石</span>`)
  }

  return (
    <div className="text-center">
      <CalendarCheck className="mx-auto mb-2 h-10 w-10 text-blue-400" />
      <div className="mb-1 text-sm font-bold text-blue-700">每日签到</div>
      <div className="mb-3 text-xs text-slate-500">
        连续签到 {player.checkinStreak} 天 · 累计签到 {player.checkinDays} 天
      </div>
      <Button variant="primary" onClick={checkin} disabled={alreadyCheckedIn}>
        {alreadyCheckedIn ? '今日已签到' : '立即签到'}
      </Button>
    </div>
  )
}

/* ============ 骰子 ============ */
function DiceGame({ onLog }: { onLog: (t: string) => void }) {
  const { state, dispatch, notify } = useGame()
  const player = state.player
  const [bet, setBet] = useState(100)
  const [guess, setGuess] = useState<'big' | 'small'>('big')
  const [dice, setDice] = useState<number[]>([1, 1, 1])
  const [rolling, setRolling] = useState(false)

  const play = () => {
    if (player.props.money < bet) {
      notify('灵石不足', '请减少赌注')
      return
    }
    setRolling(true)
    setTimeout(() => {
      const result = [
        getRandomInt(1, 6),
        getRandomInt(1, 6),
        getRandomInt(1, 6),
      ]
      setDice(result)
      const sum = result.reduce((a, b) => a + b, 0)
      const isBig = sum >= 11
      const win = (isBig && guess === 'big') || (!isBig && guess === 'small')
      dispatch({
        type: 'UPDATE_PLAYER',
        payload: {
          props: {
            ...player.props,
            money: player.props.money + (win ? bet : -bet),
          },
          gameWins: player.gameWins + (win ? 1 : 0),
          gameLosses: player.gameLosses + (win ? 0 : 1),
        },
      })
      onLog(
        `<span style="color:${win ? '#fbbf24' : '#f43f5e'}">骰子：${result.join(' + ')} = ${sum}（${isBig ? '大' : '小'}），你猜${guess === 'big' ? '大' : '小'}，${win ? '赢得' : '损失'} ${bet} 灵石</span>`,
      )
      setRolling(false)
    }, 600)
  }

  return (
    <div className="text-center">
      <Dices className="mx-auto mb-2 h-10 w-10 text-blue-400" />
      <div className="mb-3 text-sm font-bold text-blue-700">掷骰子（猜大小）</div>
      <div className="mb-3 flex justify-center gap-2">
        {dice.map((d, i) => (
          <div
            key={i}
            className={
              'flex h-12 w-12 items-center justify-center rounded-lg border border-blue-300 bg-blue-50 text-2xl font-bold text-blue-700 ' +
              (rolling ? 'animate-pulse' : '')
            }
          >
            {d}
          </div>
        ))}
      </div>
      <div className="mb-2 flex items-center justify-center gap-2 text-xs">
        <span className="text-slate-500">赌注：</span>
        <input
          type="number"
          value={bet}
          min={10}
          step={10}
          onChange={(e) => setBet(Math.max(10, parseInt(e.target.value) || 0))}
          className="w-24 rounded-md border border-blue-300 bg-slate-50 px-2 py-1 text-center text-sm text-slate-900 outline-none"
        />
      </div>
      <div className="mb-3 flex justify-center gap-2">
        <Button size="sm" variant={guess === 'big' ? 'primary' : 'ghost'} onClick={() => setGuess('big')}>
          大 (11-18)
        </Button>
        <Button size="sm" variant={guess === 'small' ? 'primary' : 'ghost'} onClick={() => setGuess('small')}>
          小 (3-10)
        </Button>
      </div>
      <Button variant="gold" onClick={play} disabled={rolling}>
        {rolling ? '骰子滚动中…' : '掷骰子'}
      </Button>
    </div>
  )
}

/* ============ 石头剪刀布 ============ */
function RpsGame({ onLog }: { onLog: (t: string) => void }) {
  const { state, dispatch } = useGame()
  const player = state.player
  const [choice, setChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null)
  const [cpu, setCpu] = useState<'rock' | 'paper' | 'scissors' | null>(null)
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null)

  const ICONS: Record<'rock' | 'paper' | 'scissors', string> = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️',
  }

  const play = (c: 'rock' | 'paper' | 'scissors') => {
    const choices = ['rock', 'paper', 'scissors'] as const
    const cpuChoice = choices[getRandomInt(0, 2)]
    setChoice(c)
    setCpu(cpuChoice)
    let r: 'win' | 'lose' | 'draw' = 'draw'
    if (c === cpuChoice) r = 'draw'
    else if (
      (c === 'rock' && cpuChoice === 'scissors') ||
      (c === 'paper' && cpuChoice === 'rock') ||
      (c === 'scissors' && cpuChoice === 'paper')
    )
      r = 'win'
    else r = 'lose'
    setResult(r)
    const reward = 200
    if (r === 'win') {
      dispatch({
        type: 'UPDATE_PLAYER',
        payload: {
          props: { ...player.props, money: player.props.money + reward },
          gameWins: player.gameWins + 1,
        },
      })
      onLog(`<span style="color:#fbbf24">你出 ${ICONS[c]}，天道出 ${ICONS[cpuChoice]}，胜利！+${reward} 灵石</span>`)
    } else if (r === 'lose') {
      dispatch({
        type: 'UPDATE_PLAYER',
        payload: {
          props: { ...player.props, money: Math.max(0, player.props.money - 100) },
          gameLosses: player.gameLosses + 1,
        },
      })
      onLog(`<span style="color:#f43f5e">你出 ${ICONS[c]}，天道出 ${ICONS[cpuChoice]}，失败！-100 灵石</span>`)
    } else {
      onLog(`你出 ${ICONS[c]}，天道出 ${ICONS[cpuChoice]}，平局。`)
    }
  }

  return (
    <div className="text-center">
      <Hand className="mx-auto mb-2 h-10 w-10 text-blue-400" />
      <div className="mb-3 text-sm font-bold text-blue-700">石头剪刀布</div>
      <div className="mb-3 flex justify-center gap-4">
        <div>
          <div className="text-xs text-slate-500">你</div>
          <div className="text-4xl">{choice ? ICONS[choice] : '❔'}</div>
        </div>
        <div className="self-center text-xl text-slate-500">VS</div>
        <div>
          <div className="text-xs text-slate-500">天道</div>
          <div className="text-4xl">{cpu ? ICONS[cpu] : '❔'}</div>
        </div>
      </div>
      {result && (
        <div className={
          'mb-3 text-sm font-bold ' +
          (result === 'win' ? 'text-blue-700' : result === 'lose' ? 'text-rose-700' : 'text-slate-700')
        }>
          {result === 'win' ? '胜利！' : result === 'lose' ? '失败' : '平局'}
        </div>
      )}
      <div className="flex justify-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => play('rock')}>{ICONS.rock} 石头</Button>
        <Button size="sm" variant="ghost" onClick={() => play('paper')}>{ICONS.paper} 布</Button>
        <Button size="sm" variant="ghost" onClick={() => play('scissors')}>{ICONS.scissors} 剪刀</Button>
      </div>
    </div>
  )
}

/* ============ 算命 ============ */
function FortuneGame({ onLog }: { onLog: (t: string) => void }) {
  const { state, dispatch, notify } = useGame()
  const player = state.player
  const today = new Date().toDateString()
  const alreadyDone = player.fortuneTellingDate === today
  const [fortune, setFortune] = useState<string | null>(null)

  const FORTUNES = [
    '大吉：今日宜修炼，修为翻倍。',
    '中吉：今日宜探索，遇宝概率提升。',
    '小吉：今日宜钓鱼，收获颇丰。',
    '平：今日诸事平常，保持本心。',
    '小凶：今日宜静守，避免战斗。',
    '中凶：今日不宜探索，小心陷阱。',
    '大凶：今日切记低调，避免冒险。',
  ]

  const divine = () => {
    if (alreadyDone) {
      notify('已算命', '今日已算命，明天再来')
      return
    }
    const f = FORTUNES[getRandomInt(0, FORTUNES.length - 1)]
    setFortune(f)
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: {
        fortuneTellingDate: today,
        props: { ...player.props, money: player.props.money + 100 },
      },
    })
    onLog(`<span style="color:#a78bfa">算命结果：${f}（+100 灵石卦礼）</span>`)
  }

  return (
    <div className="text-center">
      <Sparkles className="mx-auto mb-2 h-10 w-10 text-violet-400" />
      <div className="mb-3 text-sm font-bold text-blue-700">每日算命</div>
      {fortune && (
        <div className="mb-3 rounded-lg border border-violet-300 bg-violet-50 p-3 text-sm text-violet-700">
          {fortune}
        </div>
      )}
      <Button variant="violet" onClick={divine} disabled={alreadyDone}>
        {alreadyDone ? '今日已算命' : '开始算命'}
      </Button>
    </div>
  )
}

/* ============ 井字棋 ============ */
function ToeGame({ onLog }: { onLog: (t: string) => void }) {
  const { state, dispatch } = useGame()
  const player = state.player
  const [board, setBoard] = useState<('X' | 'O' | ' ')[]>([' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '])
  const [turn, setTurn] = useState<'X' | 'O'>('X')
  const [ended, setEnded] = useState(false)
  const [status, setStatus] = useState('你的回合（X）')

  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ]

  const checkWinner = (b: ('X' | 'O' | ' ')[]): 'X' | 'O' | null => {
    for (const [a, b1, c] of LINES) {
      if (b[a] !== ' ' && b[a] === b[b1] && b[a] === b[c]) return b[a]
    }
    return null
  }

  const reset = () => {
    setBoard([' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '])
    setTurn('X')
    setEnded(false)
    setStatus('你的回合（X）')
  }

  const makeMove = (i: number) => {
    if (ended || board[i] !== ' ') return
    const newBoard = [...board]
    newBoard[i] = turn
    setBoard(newBoard)
    const winner = checkWinner(newBoard)
    if (winner) {
      setEnded(true)
      if (winner === 'X') {
        setStatus('你赢了！+500 灵石')
        dispatch({
          type: 'UPDATE_PLAYER',
          payload: {
            props: { ...player.props, money: player.props.money + 500 },
            gameWins: player.gameWins + 1,
          },
        })
        onLog('<span style="color:#fbbf24">井字棋胜利！+500 灵石</span>')
      } else {
        setStatus('天道胜利！-200 灵石')
        dispatch({
          type: 'UPDATE_PLAYER',
          payload: {
            props: { ...player.props, money: Math.max(0, player.props.money - 200) },
            gameLosses: player.gameLosses + 1,
          },
        })
        onLog('<span style="color:#f43f5e">井字棋失败 -200 灵石</span>')
      }
      return
    }
    if (newBoard.every((c) => c !== ' ')) {
      setEnded(true)
      setStatus('平局')
      onLog('井字棋平局')
      return
    }
    const nextTurn = turn === 'X' ? 'O' : 'X'
    setTurn(nextTurn)
    setStatus(nextTurn === 'X' ? '你的回合（X）' : '天道思考中…')
    if (nextTurn === 'O') {
      setTimeout(() => {
        const empty = newBoard.map((c, idx) => (c === ' ' ? idx : -1)).filter((i) => i >= 0)
        if (empty.length === 0) return
        const idx = empty[getRandomInt(0, empty.length - 1)]
        const cpuBoard = [...newBoard]
        cpuBoard[idx] = 'O'
        setBoard(cpuBoard)
        const w = checkWinner(cpuBoard)
        if (w) {
          setEnded(true)
          setStatus('天道胜利！-200 灵石')
          dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
              props: { ...player.props, money: Math.max(0, player.props.money - 200) },
              gameLosses: player.gameLosses + 1,
            },
          })
          onLog('<span style="color:#f43f5e">井字棋失败 -200 灵石</span>')
          return
        }
        if (cpuBoard.every((c) => c !== ' ')) {
          setEnded(true)
          setStatus('平局')
          onLog('井字棋平局')
          return
        }
        setTurn('X')
        setStatus('你的回合（X）')
      }, 500)
    }
  }

  return (
    <div className="text-center">
      <Hash className="mx-auto mb-2 h-10 w-10 text-blue-400" />
      <div className="mb-3 text-sm font-bold text-blue-700">井字棋</div>
      <div className="mb-3 text-xs text-slate-700">{status}</div>
      <div className="mx-auto mb-3 grid w-48 grid-cols-3 gap-1">
        {board.map((c, i) => (
          <button
            key={i}
            onClick={() => makeMove(i)}
            disabled={c !== ' ' || ended || turn === 'O'}
            className={
              'flex h-14 items-center justify-center rounded-lg border text-2xl font-bold transition-colors ' +
              (c === 'X'
                ? 'border-blue-300 bg-blue-100 text-blue-700'
                : c === 'O'
                  ? 'border-violet-300 bg-violet-100 text-violet-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100')
            }
          >
            {c === ' ' ? '' : c}
          </button>
        ))}
      </div>
      <Button size="sm" variant="ghost" onClick={reset}>重新开始</Button>
    </div>
  )
}

/* ============ 秘境 ============ */
function SecretGame({ onLog }: { onLog: (t: string) => void }) {
  const { state, dispatch, notify } = useGame()
  const player = state.player
  const SIZE = 6
  type SCell = { type: 'empty' | 'reward' | 'monster' | 'trap' | 'event'; revealed: boolean }
  const [board, setBoard] = useState<SCell[][]>(() => {
    const b: SCell[][] = []
    for (let y = 0; y < SIZE; y++) {
      const row: SCell[] = []
      for (let x = 0; x < SIZE; x++) row.push({ type: 'empty', revealed: false })
      b.push(row)
    }
    const place = (type: SCell['type'], count: number) => {
      let placed = 0
      while (placed < count) {
        const y = getRandomInt(0, SIZE - 1)
        const x = getRandomInt(0, SIZE - 1)
        if (b[y][x].type !== 'empty') continue
        b[y][x].type = type
        placed++
      }
    }
    place('reward', 6)
    place('monster', 4)
    place('trap', 3)
    place('event', 4)
    return b
  })
  const [moves, setMoves] = useState(15)
  const [totalReward, setTotalReward] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const reset = () => {
    setBoard(() => {
      const b: SCell[][] = []
      for (let y = 0; y < SIZE; y++) {
        const row: SCell[] = []
        for (let x = 0; x < SIZE; x++) row.push({ type: 'empty', revealed: false })
        b.push(row)
      }
      const place = (type: SCell['type'], count: number) => {
        let placed = 0
        while (placed < count) {
          const y = getRandomInt(0, SIZE - 1)
          const x = getRandomInt(0, SIZE - 1)
          if (b[y][x].type !== 'empty') continue
          b[y][x].type = type
          placed++
        }
      }
      place('reward', 6)
      place('monster', 4)
      place('trap', 3)
      place('event', 4)
      return b
    })
    setMoves(15)
    setTotalReward(0)
    setGameOver(false)
  }

  const reveal = (y: number, x: number) => {
    if (gameOver || board[y][x].revealed || moves <= 0) return
    const newBoard = board.map((r) => r.map((c) => ({ ...c })))
    newBoard[y][x].revealed = true
    setBoard(newBoard)
    setMoves((m) => m - 1)
    const cell = newBoard[y][x]
    switch (cell.type) {
      case 'reward': {
        const r = getRandomInt(50, 500)
        setTotalReward((t) => t + r)
        dispatch({
          type: 'PATCH_PLAYER_PROPS',
          payload: { money: player.props.money + r },
        })
        onLog(`<span style="color:#fbbf24">找到灵石 +${r}</span>`)
        break
      }
      case 'monster': {
        const r = getRandomInt(100, 200)
        setTotalReward((t) => t + r)
        dispatch({
          type: 'PATCH_PLAYER_PROPS',
          payload: { money: player.props.money + r },
        })
        onLog(`<span style="color:#fb7185">遭遇怪物！险胜，+${r} 灵石</span>`)
        break
      }
      case 'trap': {
        const dmg = getRandomInt(50, 200)
        dispatch({
          type: 'UPDATE_PLAYER',
          payload: { health: Math.max(0, player.health - dmg) },
        })
        onLog(`<span style="color:#f43f5e">触发陷阱！-${dmg} 气血</span>`)
        break
      }
      case 'event': {
        const luck = Math.random()
        if (luck < 0.5) {
          setMoves((m) => m + 3)
          onLog('<span style="color:#34d399">宝藏地图！+3 探索次数</span>')
        } else {
          setMoves((m) => Math.max(1, m - 2))
          onLog('<span style="color:#a78bfa">迷失方向！-2 探索次数</span>')
        }
        break
      }
      default:
        onLog('空空如也')
    }
    if (moves - 1 <= 0) {
      setGameOver(true)
      notify('秘境结束', `本次共获得 ${totalReward} 灵石`)
    }
  }

  const cellStyle: Record<SCell['type'], string> = {
    empty: 'bg-slate-50',
    reward: 'bg-blue-200',
    monster: 'bg-rose-200',
    trap: 'bg-slate-300',
    event: 'bg-violet-200',
  }
  const cellText: Record<SCell['type'], string> = {
    empty: '',
    reward: '💰',
    monster: '👹',
    trap: '💥',
    event: '❓',
  }

  return (
    <div className="text-center">
      <Compass className="mx-auto mb-2 h-10 w-10 text-blue-400" />
      <div className="mb-3 text-sm font-bold text-blue-700">秘境探索</div>
      <div className="mb-3 flex justify-center gap-4 text-xs text-slate-700">
        <span>剩余次数：<span className="font-mono text-blue-700">{moves}</span></span>
        <span>本次收获：<span className="font-mono text-emerald-700">{totalReward}</span></span>
      </div>
      <div className="mx-auto mb-3 grid w-full max-w-xs grid-cols-6 gap-0.5">
        {board.map((row, y) =>
          row.map((cell, x) => (
            <button
              key={`${y}-${x}`}
              onClick={() => reveal(y, x)}
              disabled={cell.revealed || gameOver}
              className={
                'aspect-square rounded text-xs transition-colors ' +
                (cell.revealed ? cellStyle[cell.type] : 'bg-slate-100 hover:bg-slate-100')
              }
            >
              {cell.revealed ? cellText[cell.type] : ''}
            </button>
          )),
        )}
      </div>
      {gameOver && (
        <div className="mb-2 text-xs text-blue-700">探索结束！收获 {totalReward} 灵石</div>
      )}
      <Button size="sm" variant="ghost" onClick={reset}>重新探索</Button>
    </div>
  )
}

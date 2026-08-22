/**
 * HomePage — 主页（修仙者信息 + 装备/背包 + 功能入口）
 *
 * 移植自 views/homePage.vue（约 2800 行，这里做了精简：
 * 保留核心的属性展示、装备穿戴、背包浏览、功能跳转；省略了部分次要弹窗如炼器、详细比较）。
 */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Edit3, Lock, Unlock, RefreshCw, Sparkles, Swords, Mountain,
  Trophy, Dices, Home as HomeIcon, Flag, ShoppingBag,
} from 'lucide-react'
import { useGame } from '../logic/store'
import type { Equipment, EquipType, Player } from '../logic/types'
import {
  formatNumberToChineseUnit, levelNames, maxLv, propItemNames,
} from '../logic/game'
import { shop as shopLogic } from '../logic/shop'
import {
  Button, Modal, Panel, ProgressBar, Stat, Tag, qualityClass, qualityText, useConfirm,
} from './ui'

type TabKey = 'equipment' | 'props' | 'pet' | 'wife' | 'shop'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'equipment', label: '装备' },
  { key: 'props', label: '道具' },
  { key: 'pet', label: '灵宠' },
  { key: 'wife', label: '道侣' },
  { key: 'shop', label: '鸿蒙商店' },
]

const GENRE: Record<EquipType, string> = {
  sutra: '法器',
  armor: '护甲',
  weapon: '神兵',
  accessory: '灵宝',
}

/** 计算玩家综合评分 */
const computeScore = (p: Player): number => {
  const eq = p.equipment
  const bonus = (['weapon', 'armor', 'accessory', 'sutra'] as EquipType[]).reduce(
    (acc, k) => {
      const e = eq[k] as Equipment | undefined
      if (!e || !e.attack) return acc
      return {
        attack: acc.attack + (e.attack || 0),
        health: acc.health + (e.health || 0),
        defense: acc.defense + (e.defense || 0),
        dodge: acc.dodge + (e.dodge || 0),
        critical: acc.critical + (e.critical || 0),
      }
    },
    { attack: 0, health: 0, defense: 0, dodge: 0, critical: 0 },
  )
  return Math.floor(
    p.attack * 1.5 +
      p.health * 0.01 +
      p.defense * 1.2 +
      (p.dodge + bonus.dodge) * 100 * 1.6 +
      (p.critical + bonus.critical) * 100 * 1.8 +
      bonus.attack * 1.5 +
      bonus.health * 0.01 +
      bonus.defense * 1.2,
  )
}

export default function HomePage() {
  const { state, dispatch, notify } = useGame()
  const player = state.player
  const [tab, setTab] = useState<TabKey>('equipment')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(player.name)
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null)
  const [levelsOpen, setLevelsOpen] = useState(false)
  const { confirm, dialog } = useConfirm()

  /** 装备一件装备 */
  const equipItem = (item: Equipment) => {
    // 从背包移除要穿戴的装备
    const filteredInventory = player.inventory.filter((i) => i.id !== item.id)
    // 若当前槽位已有装备，将其放回背包（与 vue 版本逻辑一致）
    const oldItem = player.equipment[item.type] as Equipment | undefined
    const hasOldItem = !!oldItem && !!oldItem.name
    // 旧装备重新生成 id 防止与背包内同 id 装备冲突
    const returnedOldItem: Equipment | null = hasOldItem
      ? { ...(oldItem as Equipment), id: Date.now() }
      : null
    const newInventory = returnedOldItem
      ? [...filteredInventory, returnedOldItem]
      : filteredInventory
    // 检查穿戴后旧装备是否会溢出背包
    if (newInventory.length > player.backpackCapacity) {
      notify('背包已满', '穿戴后旧装备将溢出背包，请先清理背包')
      return
    }
    const newEq = { ...player.equipment, [item.type]: item }
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: { equipment: newEq, inventory: newInventory },
    })
    notify('装备成功', `已穿戴：${item.name}`)
  }

  /** 卸下装备 */
  const unequipItem = (slot: EquipType) => {
    const cur = player.equipment[slot] as Equipment | undefined
    if (!cur || !cur.name) return
    if (player.inventory.length >= player.backpackCapacity) {
      notify('背包已满', '无法卸下装备，请先清理背包')
      return
    }
    const newEq = { ...player.equipment, [slot]: {} }
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: { equipment: newEq, inventory: [...player.inventory, cur] },
    })
  }

  /** 分解装备 */
  const decompose = (item: Equipment) => {
    const reward = Math.floor(item.score / 10) + 10
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: {
        inventory: player.inventory.filter((i) => i.id !== item.id),
        props: {
          ...player.props,
          money: player.props.money + reward,
          strengtheningStone: player.props.strengtheningStone + 1,
        },
      },
    })
    notify('分解成功', `获得 ${reward} 灵石 + 1 炼器石`)
  }

  /** 加点 */
  const addPoint = (attr: 'health' | 'attack' | 'defense') => {
    if (player.points <= 0) return
    const updates: Partial<Player> = { points: player.points - 1 }
    if (attr === 'health') {
      updates.health = player.health + 100
      updates.maxHealth = player.maxHealth + 100
    } else if (attr === 'attack') {
      updates.attack = player.attack + 5
    } else {
      updates.defense = player.defense + 5
    }
    dispatch({ type: 'UPDATE_PLAYER', payload: updates })
  }

  /** 刷新商店 */
  const refreshShop = () => {
    if (player.props.money < 500) {
      notify('灵石不足', '刷新商店需要 500 灵石')
      return
    }
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: {
        shopData: shopLogic.drawPrize(Math.max(1, player.level)),
        props: { ...player.props, money: player.props.money - 500 },
      },
    })
  }

  /** 购买商店物品 */
  const buyShopItem = (item: Equipment) => {
    const price = item.score * 10 + 5000
    if (player.props.money < price) {
      notify('灵石不足', `需要 ${formatNumberToChineseUnit(price)} 灵石`)
      return
    }
    if (player.inventory.length >= player.backpackCapacity) {
      notify('背包已满', '请先清理背包')
      return
    }
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: {
        inventory: [...player.inventory, { ...item, lock: false }],
        props: { ...player.props, money: player.props.money - price },
      },
    })
    notify('购买成功', `获得 ${item.name}`)
  }

  /** 锁定/解锁装备 */
  const toggleLock = (item: Equipment) => {
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: {
        inventory: player.inventory.map((i) =>
          i.id === item.id ? { ...i, lock: !i.lock } : i,
        ),
      },
    })
  }

  const score = useMemo(() => computeScore(player), [player])

  const sortedInventory = useMemo(() => {
    const byType: Record<EquipType, Equipment[]> = { weapon: [], armor: [], accessory: [], sutra: [] }
    player.inventory.forEach((i) => byType[i.type].push(i))
    return byType
  }, [player.inventory])

  const sortedProps = useMemo(() => {
    return Object.entries(player.props)
      .filter(([_, num]) => num > 0)
      .map(([name, num]) => ({ name, num }))
  }, [player.props])

  const goto = (page: 'cultivate' | 'boss' | 'endless' | 'map' | 'game') => {
    dispatch({ type: 'SET_PAGE', payload: page })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 顶部：属性面板 */}
      <Panel glow>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingName(true)}
                className="group flex items-center gap-1 text-lg font-bold text-blue-700 hover:text-blue-800"
              >
                {player.name}
                {player.currentTitle && (
                  <span className="rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-700">
                    [{player.currentTitle}]
                  </span>
                )}
                <Edit3 className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              年纪：{player.age} 岁 · 境界：
              <button
                onClick={() => setLevelsOpen(true)}
                className="text-blue-700 hover:text-blue-800 underline-offset-2 hover:underline"
              >
                {levelNames(player.level)}
              </button>
              {player.reincarnation > 0 && (
                <span className="ml-1 text-violet-700">({player.reincarnation}转)</span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs text-slate-500">总体实力</div>
            <div className="font-mono text-xl font-bold text-blue-700">
              {formatNumberToChineseUnit(score)}
            </div>
          </div>
        </div>

        {/* 修炼进度 */}
        <div className="mt-3">
          {player.level >= maxLv ? (
            <p className="text-center text-xs text-blue-700">修为登峰造极</p>
          ) : (
            <ProgressBar
              value={player.cultivation}
              max={player.maxCultivation}
              label="修为进度"
              color="amber"
            />
          )}
        </div>

        {/* 属性 */}
        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          <Stat
            label="气血"
            value={`${formatNumberToChineseUnit(player.health)} / ${formatNumberToChineseUnit(player.maxHealth)}`}
            highlight
          />
          <Stat label="攻击" value={formatNumberToChineseUnit(player.attack)} onAdd={player.points > 0 ? () => addPoint('attack') : undefined} />
          <Stat label="防御" value={formatNumberToChineseUnit(player.defense)} onAdd={player.points > 0 ? () => addPoint('defense') : undefined} />
          <Stat label="闪避率" value={`${(player.dodge * 100).toFixed(2)}%`} />
          <Stat label="暴击率" value={`${(player.critical * 100).toFixed(2)}%`} />
          <Stat label="境界点" value={player.points} highlight />
          <Stat
            label="背包"
            value={`${player.inventory.length} / ${player.backpackCapacity}`}
          />
        </div>

        {/* 道具栏 */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {sortedProps.map(({ name, num }) => (
            <span
              key={name}
              className="rounded-md border border-sky-500/30 bg-sky-50 px-2 py-0.5 text-sky-700"
              title={propItemNames[name]?.desc || ''}
            >
              {propItemNames[name]?.name || name}：{formatNumberToChineseUnit(num)}
            </span>
          ))}
        </div>
      </Panel>

      {/* 装备栏 */}
      <Panel>
        <div className="mb-2 text-xs font-bold text-blue-700">穿戴装备</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(['weapon', 'armor', 'accessory', 'sutra'] as EquipType[]).map((slot) => {
            const e = player.equipment[slot] as Equipment | undefined
            return (
              <div
                key={slot}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
              >
                <div className="text-slate-500">{GENRE[slot]}</div>
                {e && e.name ? (
                  <div className="mt-1 flex items-center justify-between">
                    <Tag
                      quality={e.quality}
                      onClick={() => setSelectedEquip(e)}
                      onClose={() => unequipItem(slot)}
                    >
                      {e.name}
                      {e.strengthen ? `+${e.strengthen}` : ''}
                    </Tag>
                  </div>
                ) : (
                  <div className="mt-1 text-slate-500">无</div>
                )}
              </div>
            )
          })}
        </div>

        {/* 道侣/灵宠 */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
            <div className="text-slate-500">道侣</div>
            {player.wife && (player.wife as { name?: string }).name ? (
              <div className="mt-1 text-slate-800">
                {(player.wife as { name: string }).name}
              </div>
            ) : (
              <div className="mt-1 text-slate-500">无</div>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
            <div className="text-slate-500">出战灵宠</div>
            {player.pet && (player.pet as { name?: string }).name ? (
              <div className="mt-1 text-slate-800">
                {(player.pet as { name: string }).name}({levelNames((player.pet as { level: number }).level)})
              </div>
            ) : (
              <div className="mt-1 text-slate-500">无</div>
            )}
          </div>
        </div>
      </Panel>

      {/* 背包 / 商店 */}
      <Panel>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  'rounded-md px-3 py-1 text-xs transition-colors ' +
                  (tab === t.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-500 hover:text-slate-800')
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'shop' && (
            <Button size="sm" variant="gold" onClick={refreshShop}>
              <RefreshCw className="h-3 w-3" /> 刷新 (500)
            </Button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {tab === 'equipment' && (
            <div className="flex flex-wrap gap-1.5">
              {(['weapon', 'armor', 'accessory', 'sutra'] as EquipType[]).map((type) =>
                sortedInventory[type].map((item) => (
                  <Tag key={item.id} quality={item.quality} onClick={() => setSelectedEquip(item)}>
                    {item.lock ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
                    {item.name}
                    {item.strengthen ? `+${item.strengthen}` : ''}
                  </Tag>
                )),
              )}
              {player.inventory.length === 0 && (
                <p className="text-xs text-slate-500">背包空空如也，去探索获取装备吧</p>
              )}
            </div>
          )}

          {tab === 'props' && (
            <div className="flex flex-wrap gap-1.5">
              {sortedProps.length === 0 ? (
                <p className="text-xs text-slate-500">暂无道具</p>
              ) : (
                sortedProps.map(({ name, num }) => (
                  <span
                    key={name}
                    className="rounded-md border border-sky-500/30 bg-sky-50 px-2 py-0.5 text-xs text-sky-700"
                    title={propItemNames[name]?.desc || ''}
                  >
                    {propItemNames[name]?.name}：{formatNumberToChineseUnit(num)}
                  </span>
                ))
              )}
            </div>
          )}

          {tab === 'pet' && (
            <div className="flex flex-wrap gap-1.5">
              {player.pets.length === 0 ? (
                <p className="text-xs text-slate-500">还没有灵宠，去探索地图收服吧</p>
              ) : (
                player.pets.map((p) => (
                  <Tag key={p.id} quality="success">
                    {p.lock ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
                    {p.name}({levelNames(p.level)})
                  </Tag>
                ))
              )}
            </div>
          )}

          {tab === 'wife' && (
            <div className="flex flex-wrap gap-1.5">
              {player.wifes.length === 0 ? (
                <p className="text-xs text-slate-500">尚未结缘</p>
              ) : (
                player.wifes.map((w, i) => (
                  <Tag key={i} quality="pink">
                    {w.name}
                  </Tag>
                ))
              )}
            </div>
          )}

          {tab === 'shop' && (
            <div className="space-y-3">
              {player.shopData.map((cat) => (
                <div key={cat.type}>
                  <div className="mb-1 text-xs text-slate-500">{cat.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.data.map((item) => (
                      <Tag key={item.id} quality="pink" onClick={() => buyShopItem(item)}>
                        {item.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>

      {/* 功能入口 */}
      <Panel>
        <div className="mb-2 text-xs font-bold text-blue-700">功能</div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <ActionButton icon={<Sparkles className="h-4 w-4" />} label="修炼" onClick={() => goto('cultivate')} variant="gold" />
          <ActionButton icon={<Mountain className="h-4 w-4" />} label="探索" onClick={() => goto('map')} variant="violet" />
          <ActionButton icon={<Flag className="h-4 w-4" />} label="世界 Boss" onClick={() => goto('boss')} variant="danger" />
          <ActionButton icon={<Swords className="h-4 w-4" />} label="无尽塔" onClick={() => goto('endless')} variant="primary" />
          <ActionButton icon={<Dices className="h-4 w-4" />} label="小游戏" onClick={() => goto('game')} variant="violet" />
          <ActionButton
            icon={<HomeIcon className="h-4 w-4" />}
            label="重置存档"
            onClick={() =>
              confirm(
                '重置存档',
                '此操作将清空所有进度且无法恢复，确定继续吗？',
                () => {
                  dispatch({ type: 'RESET' })
                  notify('已重置', '存档已清空，开始新的修仙之旅')
                },
                true,
              )
            }
            variant="ghost"
          />
        </div>
      </Panel>

      {/* 装备详情弹窗 */}
      <Modal
        open={!!selectedEquip}
        title={selectedEquip?.name || ''}
        onClose={() => setSelectedEquip(null)}
        footer={
          selectedEquip && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={() => { equipItem(selectedEquip); setSelectedEquip(null) }}>
                穿戴
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggleLock(selectedEquip)}>
                {selectedEquip.lock ? '解锁' : '锁定'}
              </Button>
              {!selectedEquip.lock && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    decompose(selectedEquip)
                    setSelectedEquip(null)
                  }}
                >
                  分解
                </Button>
              )}
            </div>
          )
        }
      >
        {selectedEquip && (
          <div className="space-y-1.5 text-xs">
            <div>
              <span className={'inline-block rounded border px-2 py-0.5 ' + qualityClass[selectedEquip.quality]}>
                {qualityText[selectedEquip.quality]} · {GENRE[selectedEquip.type]}
              </span>
            </div>
            <Stat label="境界要求" value={levelNames(selectedEquip.level)} />
            <Stat label="评分" value={formatNumberToChineseUnit(selectedEquip.score)} highlight />
            {selectedEquip.attack > 0 && <Stat label="攻击" value={formatNumberToChineseUnit(selectedEquip.attack)} />}
            {selectedEquip.health > 0 && <Stat label="气血" value={formatNumberToChineseUnit(selectedEquip.health)} />}
            {selectedEquip.defense > 0 && <Stat label="防御" value={formatNumberToChineseUnit(selectedEquip.defense)} />}
            {selectedEquip.dodge > 0 && <Stat label="闪避率" value={`${(selectedEquip.dodge * 100).toFixed(2)}%`} />}
            {selectedEquip.critical > 0 && <Stat label="暴击率" value={`${(selectedEquip.critical * 100).toFixed(2)}%`} />}
          </div>
        )}
      </Modal>

      {/* 改名弹窗 */}
      <Modal
        open={editingName}
        title="修改道号"
        onClose={() => setEditingName(false)}
        footer={
          <>
            <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>取消</Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (nameInput.trim()) {
                  dispatch({ type: 'UPDATE_PLAYER', payload: { name: nameInput.trim().slice(0, 12) } })
                  setEditingName(false)
                }
              }}
            >
              确定
            </Button>
          </>
        }
      >
        <input
          autoFocus
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          maxLength={12}
          className="w-full rounded-lg border border-blue-400/30 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400/60"
          placeholder="请输入新道号"
        />
      </Modal>

      {/* 境界表 */}
      <Modal
        open={levelsOpen}
        title="修仙境界表"
        onClose={() => setLevelsOpen(false)}
      >
        <div className="grid max-h-80 grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-4">
          {Array.from({ length: maxLv }, (_, i) => i + 1).map((lv) => (
            <span
              key={lv}
              className={
                'rounded border px-1.5 py-0.5 text-center text-[10px] ' +
                (player.level === lv
                  ? 'border-sky-400 bg-sky-100 text-sky-700'
                  : lv > player.level
                    ? 'border-rose-200 bg-rose-50 text-rose-700/70'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700')
              }
            >
              {levelNames(lv)}
            </span>
          ))}
        </div>
      </Modal>

      {dialog}
    </div>
  )
}

/* ============ 功能按钮 ============ */
function ActionButton({
  icon,
  label,
  onClick,
  variant = 'ghost',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'gold' | 'violet'
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={
        'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs transition-colors ' +
        (variant === 'gold'
          ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
          : variant === 'violet'
            ? 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100'
            : variant === 'danger'
              ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
              : variant === 'primary'
                ? 'border-blue-300 bg-gradient-to-b from-blue-100 to-sky-50 text-blue-800 hover:from-blue-200'
                : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100')
      }
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  )
}

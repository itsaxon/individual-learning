<template>
  <div class="secret-realm">
    <div class="game-info">
      <div class="info-item">
        <span class="info-label">探索次数</span>
        <span class="info-value">{{ movesLeft }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">获得灵石</span>
        <span class="info-value">{{ rewardMoney }}</span>
      </div>
    </div>
    <div class="game-board">
      <template v-for="(row, rowIndex) in board" :key="rowIndex">
        <div
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          class="board-cell"
          :class="{ revealed: cell.revealed, [cell.type]: cell.revealed }"
          @click="revealCell(rowIndex, colIndex)"
        >
          {{ cell.revealed ? getCellContent(cell) : '' }}
        </div>
      </template>
    </div>
    <div class="new-game-button">
      <el-button @click="startNewGame" :disabled="!gameOver" v-if="!gameOver && canExplore">探索中</el-button>
      <el-countdown title="下次探索时间" :value="nextExploreTime" @finish="startNewGame" v-else />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { gameNotifys } from '@/plugins/game'

  const store = useMainStore()

  const player = ref(store.player)
  const board = ref([])
  const gameOver = ref(false)
  const boardSize = ref(8)
  const movesLeft = ref(20)
  const rewardMoney = ref(0)
  const cellTypes = ref({
    TRAP: 'trap',
    EMPTY: 'empty',
    EVENT: 'event',
    REWARD: 'reward',
    MONSTER: 'monster'
  })

  const canExplore = computed(() => {
    return Date.now() >= nextExploreTime.value
  })

  const nextExploreTime = computed(() => {
    return player.value.nextGameTimes.secretrealm
  })

  const initializeBoard = () => {
    board.value = Array(boardSize.value)
      .fill()
      .map(() =>
        Array(boardSize.value)
          .fill()
          .map(() => ({
            type: cellTypes.value.EMPTY,
            revealed: false
          }))
      )
    placeRandomCells(cellTypes.value.REWARD, 10)
    placeRandomCells(cellTypes.value.MONSTER, 5)
    placeRandomCells(cellTypes.value.TRAP, 3)
    placeRandomCells(cellTypes.value.EVENT, 5)
  }

  const placeRandomCells = (type, count) => {
    for (let i = 0; i < count; i++) {
      let row, col
      do {
        row = Math.floor(Math.random() * boardSize.value)
        col = Math.floor(Math.random() * boardSize.value)
      } while (board.value[row][col].type !== cellTypes.value.EMPTY)
      board.value[row][col].type = type
    }
  }

  const revealCell = (row, col) => {
    if (gameOver.value || board.value[row][col].revealed || !canExplore.value || movesLeft.value <= 0) return
    const cell = board.value[row][col]
    cell.revealed = true
    movesLeft.value--
    switch (cell.type) {
      case cellTypes.value.REWARD:
        const reward = Math.floor(Math.random() * 500) + 50
        gameNotifys({ title: '找到灵石啦', message: `获得${reward}灵石` })
        rewardMoney.value += reward
        player.value.props.money += reward
        break
      case cellTypes.value.MONSTER:
        gameNotifys({ title: '你真倒霉', message: '遇到了一只怪物' })
        startBattle()
        break
      case cellTypes.value.TRAP:
        const damage = Math.floor(Math.random() * 200) + 50
        player.value.health = Math.max(0, player.value.health - damage)
        gameNotifys({ title: '真晦气', message: `生命值减少${damage}` })
        break
      case cellTypes.value.EVENT:
        triggerRandomEvent()
        break
    }
    if (movesLeft.value <= 0) {
      gameOver.value = true
      player.value.nextGameTimes.secretrealm = Date.now() + 120 * 60 * 1000
    }
  }

  const getCellContent = cell => {
    const { TRAP, EVENT, REWARD, MONSTER } = cellTypes.value
    const contents = {
      [TRAP]: '💥',
      [EVENT]: '❓',
      [REWARD]: '💰',
      [MONSTER]: '👹'
    }
    return contents[cell.type] || ''
  }

  const startBattle = () => {
    const playerWon = Math.random() > 0.5
    if (playerWon) {
      const battleReward = Math.floor(Math.random() * 200) + 100
      rewardMoney.value += battleReward
      player.value.props.money += battleReward
    } else {
      const damage = Math.floor(Math.random() * 30) + 20
      player.value.health = Math.max(0, player.value.health - damage)
    }
  }

  const triggerRandomEvent = () => {
    const events = [
      {
        name: '幸运符',
        effect: () => {
          rewardMoney.value *= 2
        }
      },
      {
        name: '遭雷劈',
        effect: () => {
          player.value.health = Math.max(0, player.value.health - 50)
        }
      },
      {
        name: '灵感顿悟',
        effect: () => {
          player.value.cultivation += 100
        }
      },
      {
        name: '迷失方向',
        effect: () => {
          movesLeft.value = Math.max(1, movesLeft.value - 5)
        }
      },
      {
        name: '宝藏地图',
        effect: () => {
          movesLeft.value += 5
        }
      }
    ]
    const event = events[Math.floor(Math.random() * events.length)]
    gameNotifys({ title: '随机事件', message: event.name })
    event.effect()
  }

  const startNewGame = () => {
    gameOver.value = false
    movesLeft.value = 20
    rewardMoney.value = 0
    initializeBoard()
  }

  onMounted(() => {
    startNewGame()
  })
</script>

<style scoped>
  .secret-realm {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: var(--el-text-color-primary);
    background-color: var(--el-bg-color);
  }

  .game-info {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .info-label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .info-value {
    font-size: 18px;
    font-weight: 600;
    margin-top: 5px;
    color: var(--el-color-primary);
  }

  .game-board {
    display: inline-grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0px;
    background-color: var(--el-border-color);
    margin: 20px 0;
  }

  .board-cell {
    width: 40px;
    height: 40px;
    background-color: var(--el-fill-color-light);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    cursor: pointer;
    transition: background-color 0.3s;
    border: 1px solid var(--el-border-color);
  }

  .board-cell:hover {
    background-color: var(--el-fill-color);
  }

  .board-cell.revealed {
    background-color: var(--el-bg-color);
  }

  .board-cell.reward {
    background-color: var(--el-color-success-light-5);
  }

  .board-cell.monster {
    background-color: var(--el-color-danger-light-5);
  }

  .board-cell.trap {
    background-color: var(--el-color-warning-light-5);
  }

  .board-cell.event {
    background-color: var(--el-color-info-light-5);
  }

  .new-game-button {
    width: 200px;
  }
</style>

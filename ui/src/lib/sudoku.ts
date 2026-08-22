/**
 * 数独核心逻辑：生成、求解、验证
 *
 * 算法：
 *   - 生成完整解：回溯 + 随机化数字顺序
 *   - 挖洞生成题目：按难度移除指定数量的格子
 *   - 求解：标准回溯
 *
 * 难度（挖洞数）：
 *   easy   35-40 格
 *   medium 45-50 格
 *   hard   50-53 格
 *   expert 55-58 格
 */

export type Difficulty = "easy" | "medium" | "hard" | "expert";

/** 9×9 棋盘，0 表示空格 */
export type Board = number[][];

/** 单元格坐标 */
export interface CellPos {
  row: number;
  col: number;
}

/** 游戏题目：puzzle（带空格）+ solution（完整解）+ 难度 */
export interface SudokuPuzzle {
  puzzle: Board;
  solution: Board;
  difficulty: Difficulty;
}

/** 笔记：每格的候选数字集合（1-9） */
export type Notes = Set<number>[][];

/** 难度配置 */
export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; holes: [number, number]; color: string }
> = {
  easy: { label: "入门", holes: [35, 40], color: "#10b981" },
  medium: { label: "进阶", holes: [45, 50], color: "#2563eb" },
  hard: { label: "困难", holes: [50, 53], color: "#f97316" },
  expert: { label: "大师", holes: [55, 58], color: "#ef4444" },
};

/** 难度选项顺序 */
export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard", "expert"];

/** 深拷贝棋盘 */
export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** 创建空的 9×9 棋盘 */
export function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

/** 创建空笔记 */
export function emptyNotes(): Notes {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>())
  );
}

/** 判断在 (row, col) 放置 num 是否合法 */
export function isValidPlacement(
  board: Board,
  row: number,
  col: number,
  num: number
): boolean {
  // 行
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  // 列
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  // 3×3 宫
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

/** 求解数独（回溯），返回是否求解成功，board 原地修改 */
export function solve(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (solve(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/** 生成完整解（随机化数字顺序） */
function generateFullBoard(): Board {
  const board = emptyBoard();

  // 随机排列 1-9
  function shuffled(): number[] {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function fill(pos: number): boolean {
    if (pos >= 81) return true;
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const nums = shuffled();
    for (const num of nums) {
      if (isValidPlacement(board, row, col, num)) {
        board[row][col] = num;
        if (fill(pos + 1)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  }

  fill(0);
  return board;
}

/** 随机整数 [min, max] */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成数独题目
 * @param difficulty 难度
 * @returns puzzle + solution
 */
export function generatePuzzle(difficulty: Difficulty): SudokuPuzzle {
  const solution = generateFullBoard();
  const puzzle = cloneBoard(solution);

  const [minHoles, maxHoles] = DIFFICULTY_CONFIG[difficulty].holes;
  const targetHoles = randInt(minHoles, maxHoles);

  // 随机选择要挖洞的位置
  const positions: CellPos[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push({ row: r, col: c });
    }
  }
  // 洗牌
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // 挖洞
  let holes = 0;
  for (const { row, col } of positions) {
    if (holes >= targetHoles) break;
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      holes++;
    }
  }

  return { puzzle, solution, difficulty };
}

/** 检查棋盘是否完成（所有格填满且无冲突） */
export function isComplete(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return false;
    }
  }
  // 检查所有行/列/宫
  for (let i = 0; i < 9; i++) {
    const rowSet = new Set<number>();
    const colSet = new Set<number>();
    for (let j = 0; j < 9; j++) {
      rowSet.add(board[i][j]);
      colSet.add(board[j][i]);
    }
    if (rowSet.size !== 9 || rowSet.has(0)) return false;
    if (colSet.size !== 9 || colSet.has(0)) return false;
  }
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxSet = new Set<number>();
      for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
        for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
          boxSet.add(board[r][c]);
        }
      }
      if (boxSet.size !== 9 || boxSet.has(0)) return false;
    }
  }
  return true;
}

/** 获取某格所在 3×3 宫的所有坐标 */
export function getBoxCells(row: number, col: number): CellPos[] {
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  const cells: CellPos[] = [];
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      cells.push({ row: r, col: c });
    }
  }
  return cells;
}

/** 统计棋盘上某数字出现的次数 */
export function countNumber(board: Board, num: number): number {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === num) count++;
    }
  }
  return count;
}

/** 格式化时间 mm:ss */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

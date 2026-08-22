/**
 * 找出冒牌货 — REST + WebSocket 客户端封装
 *
 * REST（base 由环境变量配置，dev=localhost:8080 / prod=8.156.64.154:8080）：
 *   POST /api/v1/impostor/room/create   {playerName}              → {code, data:{roomId, playerId}}
 *   POST /api/v1/impostor/room/join     {roomId, playerName}       → {code, data:{roomId, playerId, players}}
 *   GET  /api/v1/impostor/room/{roomId}                            → {code, data:{roomId, hostId, players, phase, playerCount, canStart}}
 *
 * WebSocket URL：{WS_BASE}?playerId=xxx&roomId=xxx
 *   客户端 → 服务器：START / CHAT / VOTE / START_VOTE / RESTART
 *   服务器 → 客户端：STATE / ROLE / CHAT / REVEAL / ERROR
 *
 * 后端 ApiResponse 包装，code=0 表示成功（非 0 为失败）。
 */

// 通过 Vite 环境变量配置后端地址；缺省回退到本地后端
const API_HOST = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";
const WS_HOST = import.meta.env.VITE_WS_BASE ?? "ws://localhost:8080";

export const API_BASE = `${API_HOST}/api/v1/impostor`;
export const WS_BASE = `${WS_HOST}/ws/impostor`;

/** 游戏阶段 */
export type Phase = "WAITING" | "DISCUSSING" | "VOTING" | "REVEALED";

/** 玩家身份 */
export type Role = "IMPOSTOR" | "CIVILIAN";

/** 玩家信息 */
export interface Player {
  id: string;
  name: string;
  online: boolean;
  voted: boolean;
  /** 是否已被投出淘汰（淘汰后不参与后续讨论与投票） */
  eliminated: boolean;
}

/** 游戏状态（STATE 消息） */
export interface GameState {
  phase: Phase;
  players: Player[];
  /** 当前阶段截止时间戳（ms），可能为空 */
  deadlineMs?: number;
  /** 投票映射：voterId → targetId */
  votes: Record<string, string>;
  /** 房主 id */
  hostId: string;
  /** 讨论阶段总秒数（通常 300） */
  discussSeconds?: number;
  /** 投票阶段总秒数（通常 60） */
  voteSeconds?: number;
  /** 当前发言者 id（讨论阶段顺序发言） */
  currentSpeakerId?: string | null;
  /** 当前发言者截止时间戳（ms） */
  speakerDeadlineMs?: number | null;
  /** 发言顺序：玩家 id 列表 */
  speakerOrder?: string[];
}

/** 聊天消息 */
export interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

/** 角色信息（ROLE 消息） */
export interface RoleInfo {
  role: Role;
  /** 平民拿到秘密词；冒牌货拿到与秘密词接近的近似词 */
  word: string | null;
}

/** 揭晓信息（REVEAL 消息） */
export interface RevealInfo {
  impostorId: string;
  impostorName: string;
  secretWord: string;
  /** 冒牌货拿到的近似词 */
  impostorWord: string;
  votedOutId: string | null;
  votedOutName: string | null;
  impostorCaught: boolean;
  winnerIds: string[];
  /** 游戏是否结束（冒牌货被抓 或 活跃玩家 ≤ 2） */
  gameOver: boolean;
  /** 是否处于反猜阶段（冒牌货被投出后有一次反猜机会） */
  counterGuessPhase: boolean;
  /** 反猜阶段截止时间戳（反猜阶段才有值） */
  counterGuessDeadlineMs: number | null;
}

/* ============================================================
   WebSocket 消息类型
   ============================================================ */

/** 客户端 → 服务器 */
export type WsClientMessage =
  | { type: "START" }
  | { type: "CHAT"; text: string }
  | { type: "VOTE"; targetId: string }
  | { type: "START_VOTE" }
  | { type: "SKIP_SPEAK" }
  | { type: "RESTART" }
  | { type: "COUNTER_GUESS"; word: string }
  | { type: "TIMEOUT" };

/** 服务器 → 客户端 */
export type WsServerMessage =
  | { type: "STATE"; state: GameState }
  | { type: "ROLE"; role: Role; word: string | null }
  | { type: "CHAT"; playerId: string; playerName: string; text: string; timestamp: number }
  | {
      type: "REVEAL";
      impostorId: string;
      impostorName: string;
      secretWord: string;
      impostorWord: string;
      votedOutId: string | null;
      votedOutName: string | null;
      impostorCaught: boolean;
      winnerIds: string[];
      gameOver: boolean;
      counterGuessPhase: boolean;
      counterGuessDeadlineMs: number | null;
    }
  | { type: "ERROR"; message: string };

/** WebSocket 事件回调 */
export interface ImpostorSocketHandlers {
  onState: (state: GameState) => void;
  onRole: (role: RoleInfo) => void;
  onChat: (msg: ChatMessage) => void;
  onReveal: (info: RevealInfo) => void;
  onError: (message: string) => void;
  onClose: (event: CloseEvent) => void;
}

/* ============================================================
   REST 助手
   ============================================================ */

/** 后端统一响应包装 */
interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    throw new Error(`请求失败：${res.status} ${res.statusText}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message || "请求失败");
  }
  return json.data;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(`请求失败：${res.status} ${res.statusText}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message || "请求失败");
  }
  return json.data;
}

/** 创建房间 */
export interface CreateRoomResult {
  roomId: string;
  playerId: string;
}
export function createRoom(playerName: string): Promise<CreateRoomResult> {
  return postJson<CreateRoomResult>("/room/create", { playerName });
}

/** 加入房间 */
export interface JoinRoomResult {
  roomId: string;
  playerId: string;
  players: Player[];
}
export function joinRoom(roomId: string, playerName: string): Promise<JoinRoomResult> {
  return postJson<JoinRoomResult>("/room/join", { roomId, playerName });
}

/** 查询房间信息 */
export interface GetRoomResult {
  roomId: string;
  hostId: string;
  players: Player[];
  phase: Phase;
  playerCount: number;
  canStart: boolean;
}
export function getRoom(roomId: string): Promise<GetRoomResult> {
  return getJson<GetRoomResult>(`/room/${encodeURIComponent(roomId)}`);
}

/* ============================================================
   WebSocket 助手
   ============================================================ */

/**
 * 创建并连接到游戏 WebSocket。
 *
 * 内部完成 JSON 解析、消息分发与错误兜底；返回原生 WebSocket 实例供
 * 调用方在卸载/离开房间时主动 close()。
 */
export function createImpostorSocket(
  roomId: string,
  playerId: string,
  handlers: ImpostorSocketHandlers,
): WebSocket {
  const url = `${WS_BASE}?playerId=${encodeURIComponent(playerId)}&roomId=${encodeURIComponent(roomId)}`;
  const ws = new WebSocket(url);

  ws.onmessage = (event: MessageEvent) => {
    // 服务器推送的是 JSON 字符串
    let raw: unknown = null;
    try {
      raw = typeof event.data === "string" ? JSON.parse(event.data) : null;
    } catch {
      // 收到无法解析的消息，忽略
      return;
    }
    if (!raw || typeof raw !== "object") return;
    const msg = raw as WsServerMessage;

    try {
      switch (msg.type) {
        case "STATE":
          handlers.onState(msg.state);
          break;
        case "ROLE":
          handlers.onRole({ role: msg.role, word: msg.word });
          break;
        case "CHAT":
          handlers.onChat({
            playerId: msg.playerId,
            playerName: msg.playerName,
            text: msg.text,
            timestamp: msg.timestamp,
          });
          break;
        case "REVEAL":
          handlers.onReveal({
            impostorId: msg.impostorId,
            impostorName: msg.impostorName,
            secretWord: msg.secretWord,
            impostorWord: msg.impostorWord,
            votedOutId: msg.votedOutId,
            votedOutName: msg.votedOutName,
            impostorCaught: msg.impostorCaught,
            winnerIds: msg.winnerIds,
            gameOver: msg.gameOver,
            counterGuessPhase: msg.counterGuessPhase,
            counterGuessDeadlineMs: msg.counterGuessDeadlineMs,
          });
          break;
        case "ERROR":
          handlers.onError(msg.message);
          break;
        default:
          // 未知消息类型，忽略（不抛错）
          break;
      }
    } catch {
      // 派发中出错不应中断 socket
    }
  };

  ws.onclose = (event: CloseEvent) => {
    handlers.onClose(event);
  };

  // onerror 不直接抛用户可见错误，让 onclose 处理断开提示
  ws.onerror = () => {
    /* 由 onclose 统一回调 */
  };

  return ws;
}

/** 发送客户端消息（自动序列化为 JSON 字符串） */
export function sendWs(ws: WebSocket | null, msg: WsClientMessage): boolean {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  try {
    ws.send(JSON.stringify(msg));
    return true;
  } catch {
    return false;
  }
}

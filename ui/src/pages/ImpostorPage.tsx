/**
 * 找出冒牌货 — 多人实时推理游戏页（亮色简约主题）
 *
 * 风格与词海寻踪/九宫寻数统一：白色背景 + 紫色强调色
 *
 * 流程：
 *   1. 入口：输入昵称 + 房间号（可选）→ 创建/加入房间
 *   2. 大厅（WAITING）：等待玩家加入，房主开始游戏
 *   3. 讨论（DISCUSSING）：3 分钟聊天讨论
 *   4. 投票（VOTING）：30 秒投票揭穿冒牌货
 *   5. 揭晓（REVEALED）：显示冒牌货身份和秘密词
 *
 * 通信：REST 建房/入房 + WebSocket 实时同步
 */
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Crown,
  Eye,
  LogIn,
  LogOut,
  Mic,
  RotateCcw,
  Send,
  Skull,
  Sparkles,
  Star,
  Users,
  Vote as VoteIcon,
  X,
} from "lucide-react";
import ImpostorBackground from "@/components/games/ImpostorBackground";
import { accentColorMap, popularGames } from "@/lib/data";
import {
  type ChatMessage,
  type GameState,
  type RevealInfo,
  type RoleInfo,
  createImpostorSocket,
  createRoom,
  joinRoom,
  sendWs,
} from "@/lib/impostorApi";

type Screen = "entry" | "room";
type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

const MAX_PLAYERS = 12;
const MIN_PLAYERS = 3;
const MAX_RECONNECT = 5;

/* 亮色简约主题通用类（与词海寻踪/九宫寻数一致） */
const CARD = "rounded-3xl border border-slate-200/70 bg-white/70 backdrop-blur-xl";
const CARD_STRONG = "rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-sm";
const INPUT =
  "w-full rounded-2xl border border-slate-300 bg-white/80 px-5 py-4 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700";
const TEXT_DIM = "text-slate-500";
const TEXT_DIMMER = "text-slate-400";

/* 会话持久化：使用 localStorage 而非 sessionStorage，
   手机上微信消息打断或退出网页后 sessionStorage 会被清除，导致无法重连房间 */
const SESSION_KEY = "impostor_session";
function loadSession(): { roomId: string; playerId: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && d.roomId && d.playerId ? d : null;
  } catch {
    return null;
  }
}
function saveSession(roomId: string, playerId: string) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ roomId, playerId }));
  } catch {
    /* ignore */
  }
}
function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function formatTime(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function formatChatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 倒计时 hook：基于 deadlineMs 每秒更新剩余秒数 */
function useCountdown(deadlineMs: number | undefined): number {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!deadlineMs) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const r = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
      setRemaining(r);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadlineMs]);
  return remaining;
}

export default function ImpostorPage() {
  const navigate = useNavigate();

  // 入口 / 房间
  const [screen, setScreen] = useState<Screen>("entry");

  // 玩家信息
  const [playerName, setPlayerName] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [playerId, setPlayerId] = useState("");

  // 游戏状态
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roleInfo, setRoleInfo] = useState<RoleInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [revealInfo, setRevealInfo] = useState<RevealInfo | null>(null);
  // 本轮投票结果（游戏未结束时显示，几秒后自动消失）
  const [roundResult, setRoundResult] = useState<RevealInfo | null>(null);
  const roundResultTimerRef = useRef<number | null>(null);

  // WebSocket 与连接状态
  const [connState, setConnState] = useState<ConnectionState>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const intentionalCloseRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const currentRoomRef = useRef<{ roomId: string; playerId: string } | null>(null);
  /** 连接超时计时器：3 分钟内未连接成功则自动断开 */
  const connectingTimeoutRef = useRef<number | null>(null);
  /** 连接超时时长（毫秒）— 3 分钟 */
  const CONNECT_TIMEOUT_MS = 3 * 60 * 1000;

  // 交互
  const [chatInput, setChatInput] = useState("");
  const [voteTarget, setVoteTarget] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  /** 返回首页 */
  const goHome = () => navigate("/");

  /** 清除连接超时计时器（连接成功或主动断开时调用） */
  const clearConnectingTimeout = () => {
    if (connectingTimeoutRef.current) {
      window.clearTimeout(connectingTimeoutRef.current);
      connectingTimeoutRef.current = null;
    }
  };

  /** 连接 WebSocket（同时支持重连） */
  const connectWs = (rid: string, pid: string) => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    }
    intentionalCloseRef.current = false;
    currentRoomRef.current = { roomId: rid, playerId: pid };
    setConnState("connecting");

    // 启动连接超时计时器：3 分钟内未连接成功则自动断开，
    // 避免玩家在「正在连接房间…」界面卡死。
    clearConnectingTimeout();
    connectingTimeoutRef.current = window.setTimeout(() => {
      // 标记为主动关闭，阻止 onClose 触发重连
      intentionalCloseRef.current = true;
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          /* ignore */
        }
        wsRef.current = null;
      }
      setConnState("disconnected");
      setError("连接超时（3 分钟），请检查网络后重试或重新创建房间");
    }, CONNECT_TIMEOUT_MS);

    const ws = createImpostorSocket(rid, pid, {
      onState: (state) => {
        // 收到首条 STATE 即视为连接成功，清除超时计时器
        clearConnectingTimeout();
        setGameState(state);
        if (state.phase === "WAITING") {
          setRevealInfo(null);
          setRoleInfo(null);
          setChatMessages([]);
          setVoteTarget(null);
        }
        // 服务器端没有本玩家的投票记录时，重置本地 voteTarget
        // （新一轮 votes 会被清空，避免上一轮的高亮残留误导玩家）
        if (!state.votes?.[pid]) {
          setVoteTarget(null);
        }
        setConnState("connected");
      },
      onRole: (info) => setRoleInfo(info),
      onChat: (msg) => setChatMessages((prev) => [...prev, msg]),
      onReveal: (info) => {
        if (info.counterGuessPhase) {
          // 反猜阶段：冒牌货被投出后有一次反猜机会，存入 revealInfo 显示反猜界面
          setRevealInfo(info);
          setRoundResult(null);
          if (roundResultTimerRef.current) {
            window.clearTimeout(roundResultTimerRef.current);
            roundResultTimerRef.current = null;
          }
        } else if (info.gameOver) {
          // 游戏结束：显示完整揭晓界面
          setRevealInfo(info);
          setRoundResult(null);
          if (roundResultTimerRef.current) {
            window.clearTimeout(roundResultTimerRef.current);
            roundResultTimerRef.current = null;
          }
        } else {
          // 本轮结束但游戏继续：显示临时提示，4 秒后消失
          setRoundResult(info);
          if (roundResultTimerRef.current) {
            window.clearTimeout(roundResultTimerRef.current);
          }
          roundResultTimerRef.current = window.setTimeout(() => {
            setRoundResult(null);
            roundResultTimerRef.current = null;
          }, 4000);
        }
      },
      onError: (message) => setError(message),
      onClose: () => {
        if (intentionalCloseRef.current) return;
        const attempts = reconnectAttemptsRef.current;
        if (attempts >= MAX_RECONNECT) {
          setConnState("disconnected");
          return;
        }
        reconnectAttemptsRef.current += 1;
        setConnState("reconnecting");
        reconnectTimerRef.current = window.setTimeout(() => {
          const cur = currentRoomRef.current;
          if (cur && !intentionalCloseRef.current) {
            connectWs(cur.roomId, cur.playerId);
          }
        }, 2000);
      },
    });

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setConnState("connected");
    };

    wsRef.current = ws;
  };

  const manualReconnect = () => {
    reconnectAttemptsRef.current = 0;
    const cur = currentRoomRef.current;
    if (cur) connectWs(cur.roomId, cur.playerId);
  };

  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true;
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          /* ignore */
        }
        wsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      clearConnectingTimeout();
    };
  }, []);

  // 初始化：尝试从 localStorage 恢复会话（支持浏览器刷新 / 误关后重开 / 手机微信打断后恢复）
  useEffect(() => {
    const session = loadSession();
    if (session && !wsRef.current) {
      setRoomId(session.roomId);
      setPlayerId(session.playerId);
      setScreen("room");
      connectWs(session.roomId, session.playerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!error) return;
    const id = window.setTimeout(() => setError(""), 3500);
    return () => window.clearTimeout(id);
  }, [error]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages.length]);

  /** 创建房间 */
  const handleCreate = async () => {
    const name = playerName.trim();
    if (!name) {
      setError("请输入昵称");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await createRoom(name);
      setRoomId(res.roomId);
      setPlayerId(res.playerId);
      saveSession(res.roomId, res.playerId);
      setScreen("room");
      connectWs(res.roomId, res.playerId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建房间失败");
    } finally {
      setBusy(false);
    }
  };

  /** 加入房间 */
  const handleJoin = async () => {
    const name = playerName.trim();
    const rid = roomIdInput.trim();
    if (!name) {
      setError("请输入昵称");
      return;
    }
    if (!rid) {
      setError("请输入房间号");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await joinRoom(rid, name);
      setRoomId(res.roomId);
      setPlayerId(res.playerId);
      saveSession(res.roomId, res.playerId);
      setScreen("room");
      connectWs(res.roomId, res.playerId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加入房间失败");
    } finally {
      setBusy(false);
    }
  };

  /** 离开房间 */
  const leaveRoom = () => {
    intentionalCloseRef.current = true;
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    }
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    clearConnectingTimeout();
    clearSession();
    setGameState(null);
    setRoleInfo(null);
    setChatMessages([]);
    setRevealInfo(null);
    setRoundResult(null);
    if (roundResultTimerRef.current) {
      window.clearTimeout(roundResultTimerRef.current);
      roundResultTimerRef.current = null;
    }
    setVoteTarget(null);
    setConnState("idle");
    setRoomId("");
    setPlayerId("");
    setRoomIdInput("");
    setScreen("entry");
  };

  /** 发送聊天 */
  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    if (sendWs(wsRef.current, { type: "CHAT", text })) {
      setChatInput("");
    } else {
      setError("连接已断开，无法发送");
    }
  };

  /** 投票 */
  const castVote = (targetId: string) => {
    if (sendWs(wsRef.current, { type: "VOTE", targetId })) {
      setVoteTarget(targetId);
    } else {
      setError("连接已断开，无法投票");
    }
  };

  /** 复制房间号（优先用 Clipboard API，不可用时降级 execCommand） */
  const copyRoomId = async () => {
    const text = roomId;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // 降级：创建临时 textarea + execCommand('copy')
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("复制失败，请手动选择房间号");
    }
  };

  const isHost = !!gameState && gameState.hostId === playerId;
  const myVote = gameState?.votes?.[playerId] ?? null;
  const players = gameState?.players ?? [];
  const playerCount = players.length;

  const voteTally = useMemo(() => {
    const tally: Record<string, number> = {};
    if (gameState?.votes) {
      for (const targetId of Object.values(gameState.votes)) {
        tally[targetId] = (tally[targetId] || 0) + 1;
      }
    }
    return tally;
  }, [gameState?.votes]);

  const phase = gameState?.phase;
  const remaining = useCountdown(gameState?.deadlineMs);

  // 投票阶段倒计时归零时，由客户端触发一次超时揭晓（幂等，后端会忽略重复调用）。
  // 避免玩家不投票或断线导致游戏永远卡在 VOTING 阶段。
  const timeoutFiredRef = useRef(false);
  useEffect(() => {
    if (phase !== "VOTING") {
      timeoutFiredRef.current = false;
      return;
    }
    if (remaining > 0) return;
    if (timeoutFiredRef.current) return;
    timeoutFiredRef.current = true;
    sendWs(wsRef.current, { type: "TIMEOUT" });
  }, [phase, remaining]);

  // 讨论阶段发言者倒计时：基于 gameState.speakerDeadlineMs
  // 发言时间归零时触发 TIMEOUT，后端轮转下一位发言者（或自动进入投票）
  const speakerRemaining = useCountdown(
    phase === "DISCUSSING" ? gameState?.speakerDeadlineMs ?? undefined : undefined,
  );
  const speakerTimeoutRef = useRef(false);
  useEffect(() => {
    if (phase !== "DISCUSSING") {
      speakerTimeoutRef.current = false;
      return;
    }
    if (speakerRemaining > 0) return;
    if (speakerTimeoutRef.current) return;
    // 校验截止时间确保真正超时（useCountdown 首次渲染 remaining=0）
    const deadline = gameState?.speakerDeadlineMs ?? 0;
    if (deadline > 0 && Date.now() < deadline) return;
    speakerTimeoutRef.current = true;
    sendWs(wsRef.current, { type: "TIMEOUT" });
  }, [phase, speakerRemaining, gameState?.speakerDeadlineMs]);

  // 反猜阶段倒计时：基于 revealInfo.counterGuessDeadlineMs
  const counterGuessActive = !!revealInfo?.counterGuessPhase;
  const counterGuessRemaining = useCountdown(
    counterGuessActive ? revealInfo?.counterGuessDeadlineMs ?? undefined : undefined,
  );
  // 反猜阶段倒计时归零时触发超时（幂等）：冒牌货未在 30 秒内反猜 → 平民胜利
  // 注意：useCountdown 首次渲染时 remaining=0，需二次校验截止时间是否真的已过
  const counterGuessTimeoutRef = useRef(false);
  useEffect(() => {
    if (!counterGuessActive) {
      counterGuessTimeoutRef.current = false;
      return;
    }
    if (counterGuessRemaining > 0) return;
    if (counterGuessTimeoutRef.current) return;
    // remaining=0 可能是 useCountdown 首次渲染的初始值，校验截止时间确保真正超时
    const deadline = revealInfo?.counterGuessDeadlineMs ?? 0;
    if (deadline > 0 && Date.now() < deadline) return;
    counterGuessTimeoutRef.current = true;
    sendWs(wsRef.current, { type: "TIMEOUT" });
  }, [counterGuessActive, counterGuessRemaining, revealInfo?.counterGuessDeadlineMs]);

  return (
    <>
      <ImpostorBackground />
      <div className="relative min-h-screen px-3 pt-6 pb-6 text-slate-900 sm:px-6 sm:pt-12 sm:pb-6 lg:px-8">
        {/* 返回摸鱼舱按钮：浮在左上角，与词海寻踪对齐 */}
        <button
          onClick={goHome}
          className="absolute left-0 top-3 z-50 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] text-slate-600 backdrop-blur-md transition-colors hover:border-violet-300 hover:text-violet-700 sm:left-4 sm:top-4 sm:px-3.5 sm:py-2 sm:text-xs lg:left-6 lg:text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          摸鱼舱
        </button>
        {/* 顶部标题栏 */}
        <header className="mx-auto mb-5 flex w-full flex-col items-center gap-3 sm:mb-6 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: -12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-1 sm:gap-1.5"
          >
            <h1 className="font-display text-3xl font-black tracking-tight sm:text-5xl md:text-6xl">
              <span className="text-slate-900">找出</span>
              <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                冒牌货
              </span>
            </h1>
            <p className="font-heading text-xs tracking-[0.3em] text-slate-500 sm:text-sm sm:tracking-[0.35em]">
              谁 是 潜 伏 的 冒 牌 货
            </p>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={screen + "-" + (phase ?? "")}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {screen === "entry" && (
              <EntryScreen
                playerName={playerName}
                setPlayerName={setPlayerName}
                roomIdInput={roomIdInput}
                setRoomIdInput={setRoomIdInput}
                onCreate={handleCreate}
                onJoin={handleJoin}
                busy={busy}
              />
            )}

            {screen === "room" && !gameState && (
              <div className="flex flex-col items-center justify-center gap-5 py-16">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-violet-500" />
                <p className="font-heading text-sm tracking-[0.2em] text-slate-500">
                  {connState === "disconnected"
                    ? "连接已断开"
                    : connState === "reconnecting"
                      ? "正在重连房间…"
                      : "正在连接房间…"}
                </p>
                {connState === "disconnected" && (
                  <p className="max-w-xs text-center text-xs leading-relaxed text-slate-400">
                    连接超时或已断开，可点击下方按钮退出房间后重新创建或加入。
                  </p>
                )}
                {roomId && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="font-heading text-xs tracking-[0.25em] text-slate-500">
                      房间号
                    </p>
                    <p className="font-display text-4xl font-black tracking-[0.15em] text-violet-600">
                      {roomId}
                    </p>
                    <button
                      onClick={copyRoomId}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-4 py-1.5 text-sm text-slate-600 backdrop-blur-md transition-colors hover:border-violet-300 hover:text-violet-700"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      复制房间号
                    </button>
                  </div>
                )}
                {/* 连接中 / 断开后均允许退出房间 */}
                <button
                  onClick={leaveRoom}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-medium text-slate-700 backdrop-blur-md transition-colors hover:border-red-300 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  退出房间
                </button>
              </div>
            )}

            {screen === "room" && gameState && phase === "WAITING" && (
              <WaitingRoom
                roomId={roomId}
                copied={copied}
                onCopy={copyRoomId}
                players={players}
                hostId={gameState.hostId}
                playerId={playerId}
                isHost={isHost}
                canStart={playerCount >= MIN_PLAYERS && playerCount <= MAX_PLAYERS}
                onStart={() => sendWs(wsRef.current, { type: "START" })}
                onLeave={leaveRoom}
              />
            )}

            {screen === "room" && gameState && phase === "DISCUSSING" && (
              <DiscussingRoom
                roleInfo={roleInfo}
                speakerRemaining={speakerRemaining}
                speakTotalSec={60}
                chatMessages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                onSend={sendChat}
                playerId={playerId}
                currentSpeakerId={gameState.currentSpeakerId ?? null}
                speakerOrder={gameState.speakerOrder ?? []}
                players={players}
                canStartVote={!players.find((p) => p.id === playerId)?.eliminated}
                onStartVote={() => sendWs(wsRef.current, { type: "START_VOTE" })}
                onSkipSpeak={() => sendWs(wsRef.current, { type: "SKIP_SPEAK" })}
                chatEndRef={chatEndRef}
              />
            )}

            {screen === "room" && gameState && phase === "VOTING" && (
              <VotingRoom
                remaining={remaining}
                totalSec={gameState.voteSeconds ?? 60}
                players={players}
                playerId={playerId}
                myVote={myVote}
                voteTarget={voteTarget}
                voteTally={voteTally}
                onVote={castVote}
              />
            )}

            {screen === "room" && gameState && phase === "REVEALED" && (
              <RevealedRoom
                revealInfo={revealInfo}
                players={players}
                playerId={playerId}
                isHost={isHost}
                counterGuessRemaining={counterGuessRemaining}
                onCounterGuess={(word) =>
                  sendWs(wsRef.current, { type: "COUNTER_GUESS", word })
                }
                onRestart={() => sendWs(wsRef.current, { type: "RESTART" })}
                onLeave={leaveRoom}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 本轮投票结果提示（游戏未结束，几秒后自动消失） */}
      <AnimatePresence>
        {roundResult && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed left-1/2 top-4 z-[300] flex max-w-[90vw] flex-col items-center gap-1 rounded-2xl border border-amber-300 bg-amber-50/95 px-5 py-3 text-center shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {roundResult.votedOutName ? (
                <span>
                  <span className="font-bold">{roundResult.votedOutName}</span> 被投出，但他是
                  <span className="text-amber-700">平民</span>！
                </span>
              ) : (
                <span>本轮无人被投出</span>
              )}
            </div>
            <p className="text-xs text-amber-700">游戏继续，进入新一轮讨论…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed left-1/2 top-4 z-[300] flex max-w-[90vw] items-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/90 px-4 py-2.5 text-sm text-red-300 shadow-lg backdrop-blur-md"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-1 rounded-full p-0.5 hover:bg-red-500/20"
              aria-label="关闭"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 连接状态提示 */}
      <AnimatePresence>
        {(connState === "reconnecting" || connState === "disconnected") && screen === "room" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 z-[300] flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/90 px-4 py-2.5 text-sm text-amber-300 shadow-lg backdrop-blur-md"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {connState === "reconnecting" ? "连接断开，正在重连…" : "重连失败，请手动重连"}
            </span>
            {connState === "disconnected" && (
              <button
                onClick={manualReconnect}
                className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
              >
                重新连接
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
   入口屏
   ============================================================ */

interface EntryScreenProps {
  playerName: string;
  setPlayerName: (v: string) => void;
  roomIdInput: string;
  setRoomIdInput: (v: string) => void;
  onCreate: () => void;
  onJoin: () => void;
  busy: boolean;
}

function EntryScreen({
  playerName,
  setPlayerName,
  roomIdInput,
  setRoomIdInput,
  onCreate,
  onJoin,
  busy,
}: EntryScreenProps) {
  const accent = accentColorMap.violet;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-6"
      >
        {/* 左侧：游戏介绍 + 玩法 */}
        <div className={`${CARD_STRONG} flex flex-col justify-between p-6 sm:p-8 lg:p-10`}>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400 bg-violet-500/10 px-3.5 py-1.5">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <span className="font-heading text-xs font-bold tracking-[0.25em] text-violet-600">
                SOCIAL DEDUCTION
              </span>
            </div>
            <h2 className="mt-5 font-display text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              谁是潜伏的
              <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                冒牌货
              </span>
              ？
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-700 sm:text-lg">
              3-12 人实时联机社交推理游戏。每人会拿到一个词语，但冒牌货拿到的词和大家不一样。通过描述线索、互相质询，揪出那个伪装者！
            </p>
          </div>

          {/* 玩法详情 */}
          <div className="mt-8 rounded-2xl border border-violet-200 bg-violet-500/[0.08] p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              <p className="font-heading text-sm font-bold tracking-[0.25em] text-violet-600">
                玩 法 流 程
              </p>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700 sm:text-base">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-600">1</span>
                <span>系统给每位玩家发放一个词语，<span className="font-semibold text-violet-700">冒牌货拿到的词与大家不同</span>（但相近）</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-600">2</span>
                <span>3 分钟讨论：每人轮流描述自己的词语，<span className="font-semibold text-violet-700">不能直接说出它</span></span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-600">3</span>
                <span>30 秒投票：选出你认为的冒牌货，票数最多者被揭穿</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-600">4</span>
                <span>揪出冒牌货 → <span className="text-emerald-600">平民胜</span>；投错人 → <span className="text-rose-600">冒牌货胜</span></span>
              </li>
            </ul>
          </div>

          {/* 数据条 */}
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-200 pt-6">
            <Stat label="支持人数" value="3-12 人" />
            <Stat label="讨论时长" value="5 分钟" />
            <Stat label="投票时长" value="1 分钟" />
          </div>
        </div>

        {/* 右侧：入口表单 */}
        <div className={`${CARD_STRONG} flex flex-col justify-center p-6 sm:p-8 lg:p-10`}>
          <div className="mb-6">
            <h3 className="font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              开始游戏
            </h3>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              输入昵称即可创建房间，或输入房间号加入好友
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block font-heading text-sm tracking-[0.25em] text-slate-700">
                玩 家 昵 称
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="输入你的昵称"
                maxLength={12}
                className={INPUT}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCreate();
                }}
              />
            </div>
            <div>
              <label className="mb-2 block font-heading text-sm tracking-[0.25em] text-slate-700">
                房 间 号 （ 加 入 时 填 写 ）
              </label>
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                placeholder="留空则创建新房间"
                maxLength={20}
                className={INPUT}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onJoin();
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={onCreate}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 py-4 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
              >
                <Users className="h-5 w-5" />
                创建房间
              </button>
              <button
                onClick={onJoin}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 py-4 text-base font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700 disabled:opacity-60"
              >
                <LogIn className="h-5 w-5" />
                加入房间
              </button>
            </div>
          </div>

          {/* 提示 */}
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            <p>
              建议 3 人以上开局体验最佳。创建房间后把房间号分享给同事，一起进入推理时刻！
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* 小数据条组件 */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-lg font-bold text-slate-900 sm:text-xl">{value}</span>
      <span className="font-heading text-xs tracking-[0.2em] text-slate-500">{label}</span>
    </div>
  );
}

/* ============================================================
   大厅屏（WAITING）
   ============================================================ */

interface WaitingRoomProps {
  roomId: string;
  copied: boolean;
  onCopy: () => void;
  players: GameState["players"];
  hostId: string;
  playerId: string;
  isHost: boolean;
  canStart: boolean;
  onStart: () => void;
  onLeave: () => void;
}

function WaitingRoom({
  roomId,
  copied,
  onCopy,
  players,
  hostId,
  playerId,
  isHost,
  canStart,
  onStart,
  onLeave,
}: WaitingRoomProps) {
  return (
    <div className="mx-auto w-full space-y-4">
      {/* 房间号 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${CARD_STRONG} p-6 text-center shadow-2xl shadow-violet-500/10 sm:p-8`}
      >
        <p className="font-heading text-sm tracking-[0.3em] text-slate-500">房间号</p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="font-display text-4xl font-black tracking-[0.15em] text-slate-900 sm:text-5xl">
            {roomId}
          </span>
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-full border border-violet-400 bg-violet-500/10 px-3 py-1.5 text-sm font-semibold text-violet-600 transition-colors hover:bg-violet-500/15"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> 已复制
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> 复制
              </>
            )}
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500">把房间号分享给好友，一起进入推理时刻</p>
      </motion.div>

      {/* 玩家列表 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${CARD} p-5 sm:p-6`}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-600" />
            <h3 className="font-heading text-sm font-bold tracking-[0.2em] text-slate-700">
              玩家列表
            </h3>
          </div>
          <span
            className={`rounded-full px-3 py-1 font-mono text-sm font-bold tabular-nums ${
              players.length >= MIN_PLAYERS
                ? "bg-emerald-500/15 text-emerald-600"
                : "bg-amber-500/15 text-amber-600"
            }`}
          >
            {players.length}/{MAX_PLAYERS}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {players.map((p) => {
            const isMe = p.id === playerId;
            const isPlayerHost = p.id === hostId;
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 ${
                  isMe
                    ? "border-violet-400 bg-violet-500/10"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isPlayerHost
                      ? "bg-gradient-to-br from-amber-300 to-amber-500 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <span className="truncate text-sm font-medium text-slate-700">
                    {p.name}
                  </span>
                  {isPlayerHost && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-600" />}
                  {isMe && (
                    <span className="text-xs font-bold text-violet-600">你</span>
                  )}
                </div>
                {!p.online && (
                  <span className="text-xs text-slate-500">离线</span>
                )}
              </motion.div>
            );
          })}
          {Array.from({ length: Math.max(0, MIN_PLAYERS - players.length) }, (_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-2.5 rounded-xl border border-dashed border-slate-200 px-3.5 py-2.5 text-slate-600"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70">
                <Users className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm">等待加入</span>
            </div>
          ))}
        </div>

        {!canStart && (
          <p className="mt-3 text-center text-sm text-amber-600">
            还需 {Math.max(0, MIN_PLAYERS - players.length)} 人才能开始游戏
          </p>
        )}
      </motion.div>

      {/* 操作按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        {isHost ? (
          <button
            onClick={onStart}
            disabled={!canStart}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 py-4 text-base font-bold text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <VoteIcon className="h-5 w-5" />
            开始游戏
          </button>
        ) : (
          <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 py-4 text-base text-slate-500">
            <Clock className="h-5 w-5 animate-pulse" />
            等待房主开始游戏…
          </div>
        )}
        <button
          onClick={onLeave}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 text-base font-medium text-slate-700 transition-colors hover:border-red-300 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
          离开房间
        </button>
      </motion.div>
    </div>
  );
}

/* ============================================================
   讨论屏（DISCUSSING）
   ============================================================ */

interface DiscussingRoomProps {
  roleInfo: RoleInfo | null;
  /** 当前发言者剩余秒数 */
  speakerRemaining: number;
  /** 每人发言总秒数 */
  speakTotalSec: number;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  onSend: () => void;
  playerId: string;
  /** 当前发言者 id */
  currentSpeakerId: string | null;
  /** 发言顺序的玩家 id 列表 */
  speakerOrder: string[];
  /** 所有玩家（用于查名字） */
  players: GameState["players"];
  /** 是否可以发起提前投票：任何活跃（未淘汰）玩家均可 */
  canStartVote: boolean;
  onStartVote: () => void;
  /** 跳过发言（仅当前发言者可用） */
  onSkipSpeak: () => void;
  chatEndRef: RefObject<HTMLDivElement | null>;
}

function DiscussingRoom({
  roleInfo,
  speakerRemaining,
  speakTotalSec,
  chatMessages,
  chatInput,
  setChatInput,
  onSend,
  playerId,
  currentSpeakerId,
  speakerOrder,
  players,
  canStartVote,
  onStartVote,
  onSkipSpeak,
  chatEndRef,
}: DiscussingRoomProps) {
  const progress = speakTotalSec > 0 ? Math.max(0, Math.min(1, speakerRemaining / speakTotalSec)) : 0;
  const urgent = speakerRemaining <= 5;
  // 校验：消息不能直接包含玩家自己的词
  const myWord = roleInfo?.word?.trim() ?? "";
  const inputContainsWord = myWord.length > 0 && chatInput.includes(myWord);
  const isMyTurn = currentSpeakerId === playerId;
  const canSend = isMyTurn && chatInput.trim().length > 0 && !inputContainsWord;

  // 当前发言者名字
  const currentSpeakerName =
    players.find((p) => p.id === currentSpeakerId)?.name ?? "未知";

  // 进入讨论环节时先短暂展示秘密词（让玩家记住自己的词），之后隐藏
  const [wordVisible, setWordVisible] = useState(false);
  const wordHideTimerRef = useRef<number | null>(null);

  // 进入讨论环节 / 角色变化时：有词则先展示 2 秒，无词则不展示
  useEffect(() => {
    if (!roleInfo?.word) {
      setWordVisible(false);
      return;
    }
    setWordVisible(true);
    if (wordHideTimerRef.current) window.clearTimeout(wordHideTimerRef.current);
    wordHideTimerRef.current = window.setTimeout(() => {
      setWordVisible(false);
      wordHideTimerRef.current = null;
    }, 2000);
    return () => {
      if (wordHideTimerRef.current) {
        window.clearTimeout(wordHideTimerRef.current);
        wordHideTimerRef.current = null;
      }
    };
  }, [roleInfo?.word, roleInfo?.role]);

  // 长按查看：按下/触屏开始时显示，松开/离开时立即隐藏
  const showWord = () => setWordVisible(true);
  const hideWord = () => setWordVisible(false);

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] w-full flex-col sm:h-[calc(100vh-13rem)]">
      {/* 角色卡片：统一灰色背景，所有玩家界面一致 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-md sm:p-6"
      >
        <div className="flex items-center gap-4">
          <button
            onMouseDown={showWord}
            onMouseUp={hideWord}
            onMouseLeave={hideWord}
            onTouchStart={showWord}
            onTouchEnd={hideWord}
            onTouchCancel={hideWord}
            className="relative flex h-14 w-14 shrink-0 select-none items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 sm:h-16 sm:w-16"
            title="按住查看词语"
          >
            <Eye className="h-7 w-7 sm:h-8 sm:w-8" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-heading text-sm tracking-[0.25em] text-slate-500">
                你的秘密词
              </p>
            </div>
            <p
              className="font-display text-3xl font-black tracking-wide text-slate-900 sm:text-4xl"
            >
              {wordVisible ? (roleInfo?.word || "???") : "• • • • •"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {wordVisible ? "松开即隐藏，注意遮挡" : "长按左侧眼睛查看（松开即隐藏）"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 发言者倒计时 + 当前发言者 + 提前投票 */}
      <div className="mt-3 flex shrink-0 items-center gap-2">
        <div
          className={`flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-md ${
            urgent
              ? "border-red-500/40 bg-red-50 text-red-600"
              : isMyTurn
                ? "border-violet-400 bg-violet-100 text-violet-600"
                : "border-amber-300 bg-amber-50 text-amber-700"
          }`}
        >
          <Clock className={`h-4 w-4 ${urgent ? "animate-pulse" : ""}`} />
          <span className="font-mono text-base font-bold tabular-nums">
            {formatTime(speakerRemaining)}
          </span>
        </div>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              urgent ? "bg-red-500" : "bg-gradient-to-r from-violet-500 to-fuchsia-500"
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {canStartVote && (
          <button
            onClick={onStartVote}
            className="shrink-0 rounded-full border border-rose-500 bg-rose-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-500/30 transition-colors hover:bg-rose-600"
          >
            提前投票
          </button>
        )}
      </div>

      {/* 当前发言者提示 */}
      <div
        className={`mt-2 shrink-0 rounded-xl border px-4 py-2 text-center text-sm font-semibold ${
          isMyTurn
            ? "border-violet-300 bg-violet-50 text-violet-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
      >
        {isMyTurn ? (
          <div className="flex items-center justify-center gap-3">
            <span className="flex items-center gap-1.5">
              <Mic className="h-4 w-4" />
              轮到你发言了！请在倒计时结束前描述你的词
            </span>
            <button
              onClick={onSkipSpeak}
              className="rounded-full border border-violet-400 bg-white px-3 py-1 text-xs font-bold text-violet-600 transition-colors hover:bg-violet-100"
            >
              跳过发言
            </button>
          </div>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <Users className="h-4 w-4" />
            正在等待「{currentSpeakerName}」发言…
          </span>
        )}
      </div>

      {/* 聊天列表 */}
      <div
        className="mt-3 flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-slate-50 p-3 backdrop-blur-md sm:p-4"
        style={{ WebkitOverflowScrolling: "touch" }}
        onWheel={(e) => {
          const el = e.currentTarget;
          const { scrollTop, scrollHeight, clientHeight } = el;
          const atTop = scrollTop <= 0;
          const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
          if (!(atTop && e.deltaY < 0) && !(atBottom && e.deltaY > 0)) {
            e.stopPropagation();
          }
        }}
      >
        {chatMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-600">
            <Users className="h-8 w-8" />
            <p className="text-sm">等待发言者开始描述…</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {chatMessages.map((msg, i) => {
              const mine = msg.playerId === playerId;
              return (
                <motion.div
                  key={`${msg.timestamp}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col gap-0.5 ${
                    mine ? "items-end" : "items-start"
                  }`}
                >
                  {!mine && (
                    <span className="px-1 text-sm font-semibold text-slate-500">
                      {msg.playerName}
                    </span>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-base ${
                      mine
                        ? "rounded-br-sm bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                        : "rounded-bl-sm border border-slate-200 bg-white/70 text-slate-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                  <span className="px-1 text-xs text-slate-600">
                    {formatChatTime(msg.timestamp)}
                  </span>
                </motion.div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* 输入区：仅当前发言者可输入 */}
      <div className="mt-3 shrink-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              isMyTurn
                ? "形容你的词语，但不要直接说出它…"
                : `等待 ${currentSpeakerName} 发言…`
            }
            maxLength={200}
            disabled={!isMyTurn}
            className={`flex-1 rounded-full border bg-white/70 px-5 py-3.5 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
              inputContainsWord
                ? "border-rose-500/60 focus:border-rose-500/60 focus:ring-rose-500/25"
                : "border-slate-200 focus:border-violet-400 focus:ring-violet-500/20"
            }`}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSend();
              }
            }}
          />
          <button
            onClick={onSend}
            disabled={!canSend}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 sm:h-14 sm:w-14"
            aria-label="发送"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        {inputContainsWord ? (
          <p className="px-2 text-sm font-medium text-rose-600">
            消息不能直接包含你的词语「{myWord}」，请改用形容的方式描述
          </p>
        ) : isMyTurn ? (
          <p className="px-2 text-sm text-slate-500">
            提示：不能直接发送你的词语，需要用形容的方式描述它
          </p>
        ) : (
          <p className="px-2 text-sm text-slate-400">
            轮到你时才能发言
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   投票屏（VOTING）
   ============================================================ */

interface VotingRoomProps {
  remaining: number;
  totalSec: number;
  players: GameState["players"];
  playerId: string;
  myVote: string | null;
  voteTarget: string | null;
  voteTally: Record<string, number>;
  onVote: (targetId: string) => void;
}

function VotingRoom({
  remaining,
  totalSec,
  players,
  playerId,
  myVote,
  voteTarget,
  voteTally,
  onVote,
}: VotingRoomProps) {
  const urgent = remaining <= 10;
  const progress = totalSec > 0 ? Math.max(0, Math.min(1, remaining / totalSec)) : 0;
  const totalVotes = Object.values(voteTally).reduce((a, b) => a + b, 0);

  // 当前玩家是否已被淘汰（被淘汰后不显示投票按钮，仅观战）
  const meEliminated = players.find((p) => p.id === playerId)?.eliminated ?? false;

  return (
    <div className="mx-auto w-full space-y-4">
      {/* 倒计时 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${CARD_STRONG} p-6 text-center shadow-2xl shadow-rose-500/10 sm:p-8`}
      >
        <div className="flex items-center justify-center gap-2">
          <VoteIcon className={`h-6 w-6 ${urgent ? "animate-pulse text-red-600" : "text-rose-600"}`} />
          <p className="font-heading text-sm tracking-[0.3em] text-slate-500">投 票 阶 段</p>
        </div>
        <p
          className={`mt-3 font-mono text-5xl font-black tabular-nums ${
            urgent ? "text-red-600" : "text-slate-900"
          }`}
        >
          {formatTime(remaining)}
        </p>
        <div className="mx-auto mt-4 h-2 w-2/3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              urgent ? "bg-red-500" : "bg-gradient-to-r from-fuchsia-500 to-violet-500"
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          已投 {totalVotes} / {players.filter((p) => !p.eliminated).length} 票 · 不能投自己
        </p>
      </motion.div>

      {/* 玩家投票列表 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${CARD} p-4 sm:p-6`}
      >
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-rose-600" />
          <h3 className="font-heading text-sm font-bold tracking-[0.2em] text-slate-700">
            选择你要揭穿的人
          </h3>
        </div>
        <div className="space-y-2.5">
          {players.filter((p) => !p.eliminated).map((p) => {
            const isMe = p.id === playerId;
            const votedByMe = myVote === p.id;
            const targetSelected = voteTarget === p.id;
            return (
              <motion.div
                key={p.id}
                layout
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                  votedByMe
                    ? "border-rose-500/50 bg-rose-500/10"
                    : isMe
                      ? "border-slate-200 bg-slate-50"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                    isMe ? "bg-slate-100 text-slate-500" : "bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white"
                  }`}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-base font-medium text-slate-700">
                      {p.name}
                    </span>
                    {isMe && (
                      <span className="text-xs font-bold text-slate-500">你</span>
                    )}
                  </div>
                </div>
                {isMe ? (
                  <span className="rounded-full bg-white/70 px-3.5 py-1.5 text-sm font-medium text-slate-500">
                    不能投自己
                  </span>
                ) : meEliminated ? (
                  <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-medium text-slate-400">
                    已被淘汰
                  </span>
                ) : votedByMe ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-3.5 py-1.5 text-sm font-bold text-rose-600">
                    <Check className="h-3.5 w-3.5" /> 已投
                  </span>
                ) : (
                  <button
                    onClick={() => onVote(p.id)}
                    disabled={!!myVote}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                      targetSelected
                        ? "bg-rose-500 text-white"
                        : myVote
                          ? "cursor-not-allowed bg-white/70 text-slate-600"
                          : "bg-rose-500/20 text-rose-600 hover:bg-rose-500/30"
                    }`}
                  >
                    投票
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {myVote && (
          <p className="mt-3 text-center text-sm text-rose-600">
            已投出你的票，等待其他人…
          </p>
        )}
      </motion.div>
    </div>
  );
}

/* ============================================================
   揭晓屏（REVEALED）
   ============================================================ */

interface RevealedRoomProps {
  revealInfo: RevealInfo | null;
  players: GameState["players"];
  playerId: string;
  isHost: boolean;
  /** 反猜阶段剩余秒数 */
  counterGuessRemaining: number;
  onCounterGuess: (word: string) => void;
  onRestart: () => void;
  onLeave: () => void;
}

function RevealedRoom({
  revealInfo,
  players,
  playerId,
  isHost,
  counterGuessRemaining,
  onCounterGuess,
  onRestart,
  onLeave,
}: RevealedRoomProps) {
  if (!revealInfo) {
    // 重连后可能错过 REVEAL 消息：提供基本操作，避免卡死
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"
        >
          <Skull className="h-8 w-8 text-slate-400" />
        </motion.div>
        <p className="font-display text-2xl font-black text-slate-700">
          游戏已结束
        </p>
        <p className="mt-2 text-sm text-slate-500">
          重连后未能获取本局结果，可等待房主开始新一局
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {isHost ? (
            <button
              onClick={onRestart}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 py-3.5 text-base font-bold text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-[1.02]"
            >
              <RotateCcw className="h-5 w-5" />
              再来一局
            </button>
          ) : (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 py-3.5 text-sm text-slate-500">
              <Clock className="h-4 w-4 animate-pulse" />
              等待房主开始新一局…
            </div>
          )}
          <button
            onClick={onLeave}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-5 py-3.5 text-base font-medium text-slate-700 transition-colors hover:border-red-300 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            离开房间
          </button>
        </div>
      </div>
    );
  }

  // 反猜阶段：冒牌货被投出后有一次反猜平民秘密词的机会。
  // 被投出的玩家（即冒牌货）看到输入框，其他玩家看到等待提示。
  // 不展示完整揭晓，避免泄露冒牌货身份与秘密词。
  if (revealInfo.counterGuessPhase) {
    return (
      <CounterGuessRoom
        revealInfo={revealInfo}
        playerId={playerId}
        remaining={counterGuessRemaining}
        onCounterGuess={onCounterGuess}
        onLeave={onLeave}
      />
    );
  }

  const caught = revealInfo.impostorCaught;
  const winnerNames = revealInfo.winnerIds
    .map((id) => players.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="mx-auto w-full space-y-4">
      {/* 胜负横幅 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className={`overflow-hidden rounded-3xl p-6 text-center text-white shadow-xl sm:p-8 ${
          caught
            ? "bg-gradient-to-br from-emerald-600 to-green-700 shadow-emerald-900/40"
            : "bg-gradient-to-br from-rose-700 to-red-800 shadow-rose-900/40"
        }`}
      >
        <motion.div
          initial={{ rotate: -30, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
          className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/20"
        >
          {caught ? <Check className="h-10 w-10" /> : <Skull className="h-10 w-10" />}
        </motion.div>
        <h2 className="font-display text-4xl font-black tracking-tight sm:text-5xl">
          {caught ? "冒牌货被抓！" : "冒牌货逃脱了"}
        </h2>
        <p className="mt-2 text-base text-white/85 sm:text-lg">
          {caught ? "平民胜利，潜伏者被识破" : "冒牌货胜利，伪装成功"}
        </p>
      </motion.div>

      {/* 揭晓卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <div className={`${CARD} p-5`}>
          <p className="font-heading text-sm tracking-[0.2em] text-slate-500">被投出</p>
          <div className="mt-2 flex items-center gap-2">
            <X className="h-5 w-5 text-rose-600" />
            <span className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              {revealInfo.votedOutName || "无人被投出"}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            {revealInfo.votedOutId
              ? revealInfo.impostorCaught
                ? "正是冒牌货本人"
                : "并非冒牌货"
              : "票数并列或无人投票"}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.08] p-5 backdrop-blur-md">
          <p className="font-heading text-sm tracking-[0.2em] text-rose-600">真正的冒牌货</p>
          <div className="mt-2 flex items-center gap-2">
            <Skull className="h-5 w-5 text-rose-600" />
            <span className="font-display text-xl font-bold text-rose-700 sm:text-2xl">
              {revealInfo.impostorName}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-rose-600/70">
            {caught ? "伪装失败，被平民识破" : "伪装成功，潜伏到底"}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] p-5 backdrop-blur-md sm:col-span-2">
          <p className="font-heading text-sm tracking-[0.2em] text-emerald-600">平民的秘密词</p>
          <div className="mt-2 flex items-center gap-2">
            <Eye className="h-6 w-6 text-emerald-600" />
            <span className="font-display text-3xl font-black tracking-wide text-emerald-700 sm:text-4xl">
              {revealInfo.secretWord}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.08] p-5 backdrop-blur-md sm:col-span-2">
          <p className="font-heading text-sm tracking-[0.2em] text-rose-600">冒牌货拿到的近似词</p>
          <div className="mt-2 flex items-center gap-2">
            <Skull className="h-6 w-6 text-rose-600" />
            <span className="font-display text-3xl font-black tracking-wide text-rose-700 sm:text-4xl">
              {revealInfo.impostorWord || "???"}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-rose-600/70">
            与平民词接近但不相同，冒牌货凭此伪装
          </p>
        </div>
      </motion.div>

      {winnerNames.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${CARD} p-5`}
        >
          <div className="mb-2 flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            <p className="font-heading text-sm tracking-[0.2em] text-slate-500">
              胜利者（{winnerNames.length} 人）
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {winnerNames.map((name, i) => (
              <span
                key={i}
                className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-700"
              >
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        {isHost ? (
          <button
            onClick={onRestart}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 py-4 text-base font-bold text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-[1.02]"
          >
            <RotateCcw className="h-5 w-5" />
            再来一局
          </button>
        ) : (
          <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 py-4 text-base text-slate-500">
            <Clock className="h-5 w-5 animate-pulse" />
            等待房主开始新一局…
          </div>
        )}
        <button
          onClick={onLeave}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 text-base font-medium text-slate-700 transition-colors hover:border-red-300 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
          离开房间
        </button>
      </motion.div>
    </div>
  );
}

/* ============================================================
   反猜阶段屏（REVEALED + counterGuessPhase）
   冒牌货被投出后有一次反猜平民秘密词的机会：
   - 被投出的玩家（冒牌货）看到输入框与倒计时
   - 其他玩家看到等待提示与倒计时
   ============================================================ */

interface CounterGuessRoomProps {
  revealInfo: RevealInfo;
  playerId: string;
  remaining: number;
  onCounterGuess: (word: string) => void;
  onLeave: () => void;
}

function CounterGuessRoom({
  revealInfo,
  playerId,
  remaining,
  onCounterGuess,
  onLeave,
}: CounterGuessRoomProps) {
  const isVotedOutMe = revealInfo.votedOutId === playerId;
  const [guessInput, setGuessInput] = useState("");
  const urgent = remaining <= 10;

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      {/* 倒计时横幅 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className={`overflow-hidden rounded-3xl p-6 text-center text-white shadow-xl sm:p-8 ${
          urgent
            ? "bg-gradient-to-br from-red-600 to-rose-800"
            : "bg-gradient-to-br from-amber-600 to-rose-700"
        }`}
      >
        <motion.div
          initial={{ rotate: -20, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 12 }}
          className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/20"
        >
          <Sparkles className="h-10 w-10" />
        </motion.div>
        <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
          反猜阶段
        </h2>
        <p className="mt-2 text-base text-white/85 sm:text-lg">
          被投出的玩家有一次反猜机会
        </p>
        <p
          className={`mt-4 font-mono text-5xl font-black tabular-nums ${
            urgent ? "animate-pulse" : ""
          }`}
        >
          {formatTime(remaining)}
        </p>
      </motion.div>

      {isVotedOutMe ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${CARD_STRONG} space-y-4 p-5 sm:p-6`}
        >
          <div className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-rose-600" />
            <h3 className="font-heading text-sm font-bold tracking-[0.2em] text-rose-700">
              最 后 机 会
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            你被投出了！现在有一次反猜机会：猜中平民的秘密词，你将单独获胜；猜错或超时，则平民胜利。请在倒计时结束前提交。
          </p>
          <input
            type="text"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="输入你认为平民的秘密词"
            maxLength={20}
            className="w-full rounded-2xl border border-slate-300 bg-white/80 px-4 py-3.5 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
            onKeyDown={(e) => {
              if (e.key === "Enter" && guessInput.trim()) {
                onCounterGuess(guessInput.trim());
              }
            }}
            autoFocus
          />
          <button
            onClick={() => {
              if (guessInput.trim()) onCounterGuess(guessInput.trim());
            }}
            disabled={!guessInput.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-rose-500 to-fuchsia-500 py-3.5 text-base font-bold text-white shadow-lg shadow-rose-500/30 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="h-5 w-5" />
            确认反猜
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${CARD_STRONG} p-6 text-center sm:p-8`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
            <Clock className="h-7 w-7 text-amber-600" />
          </div>
          <p className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
            {revealInfo.votedOutName ? revealInfo.votedOutName : "被投出的玩家"}
            正在反猜…
          </p>
          <p className="mt-2 text-sm text-slate-500">
            等待反猜结果揭晓，请稍候
          </p>
        </motion.div>
      )}

      <button
        onClick={onLeave}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-5 py-3.5 text-base font-medium text-slate-700 transition-colors hover:border-red-300 hover:text-red-600"
      >
        <LogOut className="h-5 w-5" />
        离开房间
      </button>
    </div>
  );
}

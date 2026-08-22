package com.individuallearning.domain.impostor.model;

import com.individuallearning.domain.impostor.model.valobj.GamePhase;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * 房间聚合根：承载一局「找出冒牌货」游戏的完整状态。
 * <p>
 * 使用可变类，players 用 {@link CopyOnWriteArrayList}、votes 用 {@link ConcurrentHashMap} 保证线程安全。
 */
public class Room {

    /** 房间最大人数 */
    public static final int MAX_PLAYERS = 12;
    /** 房间最小开局人数 */
    public static final int MIN_PLAYERS = 3;

    private final String roomId;
    private final String hostId;
    private final List<Player> players;
    private final Map<String, String> votes;
    private final List<ChatMessage> messages;
    private final long createdAt;

    private GamePhase phase;
    private String secretWord;
    /** 冒牌货拿到的近似词（与 secretWord 接近但不相同） */
    private String impostorWord;
    private String impostorId;
    private long phaseDeadlineMs;
    /** 是否处于反猜阶段（冒牌货被投出后有一次反猜机会） */
    private boolean counterGuessPhase;
    /** 反猜阶段截止时间戳 */
    private long counterGuessDeadlineMs;
    /** 发言顺序：玩家 id 列表（随机打乱） */
    private List<String> speakerOrder = new CopyOnWriteArrayList<>();
    /** 当前发言者在 speakerOrder 中的索引 */
    private int speakerIndex;
    /** 当前发言者截止时间戳 */
    private long speakerDeadlineMs;

    public Room(String roomId, String hostId) {
        this.roomId = roomId;
        this.hostId = hostId;
        this.players = new CopyOnWriteArrayList<>();
        this.votes = new ConcurrentHashMap<>();
        this.messages = new CopyOnWriteArrayList<>();
        this.createdAt = System.currentTimeMillis();
        this.phase = GamePhase.WAITING;
        this.secretWord = null;
        this.impostorWord = null;
        this.impostorId = null;
        this.phaseDeadlineMs = 0L;
        this.counterGuessPhase = false;
        this.counterGuessDeadlineMs = 0L;
    }

    public String getRoomId() {
        return roomId;
    }

    public String getHostId() {
        return hostId;
    }

    public List<Player> getPlayers() {
        return Collections.unmodifiableList(players);
    }

    public Map<String, String> getVotes() {
        return Collections.unmodifiableMap(votes);
    }

    public List<ChatMessage> getMessages() {
        return Collections.unmodifiableList(messages);
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public GamePhase getPhase() {
        return phase;
    }

    public String getSecretWord() {
        return secretWord;
    }

    public String getImpostorWord() {
        return impostorWord;
    }

    public String getImpostorId() {
        return impostorId;
    }

    public long getPhaseDeadlineMs() {
        return phaseDeadlineMs;
    }

    public boolean isCounterGuessPhase() {
        return counterGuessPhase;
    }

    public void setCounterGuessPhase(boolean counterGuessPhase) {
        this.counterGuessPhase = counterGuessPhase;
    }

    public long getCounterGuessDeadlineMs() {
        return counterGuessDeadlineMs;
    }

    public void setCounterGuessDeadlineMs(long counterGuessDeadlineMs) {
        this.counterGuessDeadlineMs = counterGuessDeadlineMs;
    }

    /** 发言顺序列表（不可变） */
    public List<String> getSpeakerOrder() {
        return Collections.unmodifiableList(speakerOrder);
    }

    /** 当前发言者索引 */
    public int getSpeakerIndex() {
        return speakerIndex;
    }

    /** 当前发言者截止时间戳 */
    public long getSpeakerDeadlineMs() {
        return speakerDeadlineMs;
    }

    /** 当前发言者 id；所有人都发完则返回 null */
    public String getCurrentSpeakerId() {
        if (speakerIndex < 0 || speakerIndex >= speakerOrder.size()) {
            return null;
        }
        return speakerOrder.get(speakerIndex);
    }

    /** 是否所有人都已发言完毕 */
    public boolean isAllSpeakersDone() {
        return speakerIndex >= speakerOrder.size();
    }

    /**
     * 初始化发言顺序（由领域服务调用）。
     *
     * @param order           发言顺序的玩家 id 列表
     * @param firstDeadlineMs 第一个发言者的截止时间戳
     */
    public void initSpeakerOrder(List<String> order, long firstDeadlineMs) {
        this.speakerOrder = new CopyOnWriteArrayList<>(order);
        this.speakerIndex = 0;
        this.speakerDeadlineMs = firstDeadlineMs;
    }

    /**
     * 轮到下一个发言者。
     *
     * @param nextDeadlineMs 下一个发言者的截止时间戳
     * @return true 表示还有下一个发言者；false 表示所有人都已发完
     */
    public boolean advanceSpeaker(long nextDeadlineMs) {
        speakerIndex++;
        if (speakerIndex >= speakerOrder.size()) {
            return false;
        }
        speakerDeadlineMs = nextDeadlineMs;
        return true;
    }

    /** 添加玩家：已存在同 id 玩家则忽略 */
    public void addPlayer(Player player) {
        if (player == null) {
            return;
        }
        if (findPlayer(player.getId()) == null) {
            players.add(player);
        }
    }

    /** 移除玩家 */
    public void removePlayer(String playerId) {
        players.removeIf(p -> p.getId().equals(playerId));
    }

    /** 查找玩家 */
    public Player findPlayer(String playerId) {
        if (playerId == null) {
            return null;
        }
        Optional<Player> hit = players.stream().filter(p -> p.getId().equals(playerId)).findFirst();
        return hit.orElse(null);
    }

    /** 不可变更新玩家：基于 with 方法生成新实例后替换列表中的旧值 */
    public void updatePlayer(Player updated) {
        if (updated == null) {
            return;
        }
        for (int i = 0; i < players.size(); i++) {
            if (players.get(i).getId().equals(updated.getId())) {
                players.set(i, updated);
                return;
            }
        }
    }

    /** 房间是否已满 */
    public boolean isFull() {
        return players.size() >= MAX_PLAYERS;
    }

    /** 是否达到开局人数（≥3） */
    public boolean isReady() {
        return players.size() >= MIN_PLAYERS;
    }

    /** 是否为房主 */
    public boolean isHost(String playerId) {
        return hostId.equals(playerId);
    }

    /** 开始游戏：进入讨论阶段 */
    public void startGame() {
        this.phase = GamePhase.DISCUSSING;
    }

    /** 进入投票阶段 */
    public void startVoting(long deadlineMs) {
        this.phase = GamePhase.VOTING;
        this.phaseDeadlineMs = deadlineMs;
        // 新一轮投票：清空上一轮投票记录
        this.votes.clear();
        // 重置所有玩家的投票状态（保留 eliminated 状态）
        List<Player> reset = new ArrayList<>();
        for (Player p : players) {
            reset.add(p.withVoted(false).withVoteTarget(null));
        }
        players.clear();
        players.addAll(reset);
    }

    /** 设置讨论阶段截止时间 */
    public void setDiscussDeadline(long deadlineMs) {
        this.phaseDeadlineMs = deadlineMs;
    }

    /** 揭晓阶段（游戏结束） */
    public void reveal() {
        this.phase = GamePhase.REVEALED;
    }

    /** 进入新一轮讨论阶段（被淘汰平民 exit 后继续游戏） */
    public void startNextRound(long discussDeadlineMs) {
        this.phase = GamePhase.DISCUSSING;
        this.phaseDeadlineMs = discussDeadlineMs;
        this.votes.clear();
        // 保留上一轮聊天记录，让玩家可以回顾之前的讨论
        // 重置发言顺序（由 ApplicationService 重新初始化）
        this.speakerOrder = new CopyOnWriteArrayList<>();
        this.speakerIndex = 0;
        this.speakerDeadlineMs = 0L;
        // 重置所有玩家的投票状态（保留 eliminated 状态）
        List<Player> reset = new ArrayList<>();
        for (Player p : players) {
            reset.add(p.withVoted(false).withVoteTarget(null));
        }
        players.clear();
        players.addAll(reset);
    }

    /** 淘汰玩家：标记 eliminated=true */
    public void eliminatePlayer(String playerId) {
        Player p = findPlayer(playerId);
        if (p == null) {
            return;
        }
        updatePlayer(p.withEliminated(true));
    }

    /** 获取活跃玩家（未淘汰） */
    public List<Player> getActivePlayers() {
        List<Player> active = new ArrayList<>();
        for (Player p : players) {
            if (!p.isEliminated()) {
                active.add(p);
            }
        }
        return active;
    }

    /** 重置房间到等待状态，准备下一局 */
    public void reset() {
        this.phase = GamePhase.WAITING;
        this.secretWord = null;
        this.impostorWord = null;
        this.impostorId = null;
        this.phaseDeadlineMs = 0L;
        this.counterGuessPhase = false;
        this.counterGuessDeadlineMs = 0L;
        this.speakerOrder = new CopyOnWriteArrayList<>();
        this.speakerIndex = 0;
        this.speakerDeadlineMs = 0L;
        this.votes.clear();
        this.messages.clear();
        List<Player> reset = new ArrayList<>();
        for (Player p : players) {
            reset.add(p.resetForNewRound());
        }
        players.clear();
        players.addAll(reset);
    }

    /** 设置秘密词、冒牌货词与冒牌货 id（由领域服务调用） */
    public void setupGame(String secretWord, String impostorWord, String impostorId, long discussDeadlineMs) {
        this.secretWord = secretWord;
        this.impostorWord = impostorWord;
        this.impostorId = impostorId;
        this.phaseDeadlineMs = discussDeadlineMs;
        this.phase = GamePhase.DISCUSSING;
        this.counterGuessPhase = false;
        this.counterGuessDeadlineMs = 0L;
        this.votes.clear();
        this.messages.clear();
        this.speakerOrder = new CopyOnWriteArrayList<>();
        this.speakerIndex = 0;
        this.speakerDeadlineMs = 0L;
    }

    /** 进入反猜阶段：冒牌货被投出后有一次反猜机会 */
    public void startCounterGuess(long deadlineMs) {
        this.phase = GamePhase.REVEALED;
        this.counterGuessPhase = true;
        this.counterGuessDeadlineMs = deadlineMs;
    }

    /** 记录一条聊天消息 */
    public void addMessage(ChatMessage message) {
        if (message != null) {
            messages.add(message);
        }
    }

    /** 记录投票（voterId → targetId） */
    public void castVote(String voterId, String targetId) {
        votes.put(voterId, targetId);
    }

    /** 在线玩家数 */
    public long onlineCount() {
        return players.stream().filter(Player::isOnline).count();
    }
}

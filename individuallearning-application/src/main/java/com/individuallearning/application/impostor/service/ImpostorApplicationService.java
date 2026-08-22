package com.individuallearning.application.impostor.service;

import com.individuallearning.application.impostor.assembler.ImpostorAssembler;
import com.individuallearning.application.impostor.command.CreateRoomCommand;
import com.individuallearning.application.impostor.command.JoinRoomCommand;
import com.individuallearning.application.impostor.dto.CreateRoomResultDTO;
import com.individuallearning.application.impostor.dto.GameStateDTO;
import com.individuallearning.application.impostor.dto.JoinRoomResultDTO;
import com.individuallearning.application.impostor.dto.RevealDTO;
import com.individuallearning.application.impostor.dto.RoleDTO;
import com.individuallearning.application.impostor.dto.RoomDTO;
import com.individuallearning.common.exception.BizException;
import com.individuallearning.domain.impostor.model.ChatMessage;
import com.individuallearning.domain.impostor.model.Player;
import com.individuallearning.domain.impostor.model.Room;
import com.individuallearning.domain.impostor.model.valobj.GamePhase;
import com.individuallearning.domain.impostor.model.valobj.ImpostorRole;
import com.individuallearning.domain.impostor.repository.ImpostorRepository;
import com.individuallearning.domain.impostor.service.ImpostorDomainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 找出冒牌货应用服务：编排用例流程、DTO 转换、调用领域服务。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImpostorApplicationService {

    /** 讨论阶段时长（毫秒）— 5 分钟（仅用于 phaseDeadlineMs，实际讨论按发言顺序） */
    private static final long DISCUSS_DURATION_MS = 300_000L;
    /** 投票阶段时长（毫秒）— 1 分钟 */
    private static final long VOTE_DURATION_MS = 60_000L;
    /** 反猜阶段时长（毫秒）— 30 秒 */
    private static final long COUNTER_GUESS_DURATION_MS = 30_000L;
    /** 每人发言时长（毫秒）— 1 分钟 */
    private static final long SPEAK_DURATION_MS = 60_000L;
    /** 房间号字符集（纯数字，便于口头传播与复制） */
    private static final char[] ROOM_ID_CHARS = "0123456789".toCharArray();

    private final ImpostorRepository impostorRepository;
    private final ImpostorDomainService impostorDomainService;

    /**
     * 创建房间：生成 6 位 roomId、UUID playerId，房主加入房间。
     */
    public CreateRoomResultDTO createRoom(CreateRoomCommand cmd) {
        requireNonBlank(cmd.playerName(), "玩家昵称不能为空");

        String roomId = generateRoomId();
        String playerId = UUID.randomUUID().toString();

        Room room = new Room(roomId, playerId);
        Player host = Player.newJoiner(playerId, cmd.playerName());
        room.addPlayer(host);
        impostorRepository.save(room);

        log.info("创建房间 roomId={}, hostId={}", roomId, playerId);
        return new CreateRoomResultDTO(roomId, playerId);
    }

    /**
     * 加入房间：校验存在 + 未满 + WAITING 阶段，生成 playerId，加入玩家。
     */
    public JoinRoomResultDTO joinRoom(JoinRoomCommand cmd) {
        requireNonBlank(cmd.roomId(), "房间号不能为空");
        requireNonBlank(cmd.playerName(), "玩家昵称不能为空");

        Room room = requireRoom(cmd.roomId());
        if (room.isFull()) {
            throw new BizException("房间已满");
        }
        if (room.getPhase() != GamePhase.WAITING) {
            throw new BizException("游戏已开始，无法加入");
        }

        String playerId = UUID.randomUUID().toString();
        Player player = Player.newJoiner(playerId, cmd.playerName());
        room.addPlayer(player);
        impostorRepository.save(room);

        log.info("加入房间 roomId={}, playerId={}", cmd.roomId(), playerId);
        return new JoinRoomResultDTO(room.getRoomId(), playerId,
                ImpostorAssembler.toPlayerDTOList(room.getPlayers()));
    }

    /**
     * 查询房间状态
     */
    public RoomDTO getRoom(String roomId) {
        Room room = requireRoom(roomId);
        return ImpostorAssembler.toRoomDTO(room);
    }

    /**
     * 开始游戏：校验房主 + 人数 ≥3，分配角色，进入讨论阶段。
     * 讨论阶段采用顺序发言：随机打乱玩家顺序作为发言顺序，第一个发言者随机指派。
     */
    public void startGame(String roomId, String hostId) {
        Room room = requireRoom(roomId);
        requireHost(room, hostId);
        if (!room.isReady()) {
            throw new BizException("至少需要 3 人才能开始游戏");
        }
        if (room.getPhase() != GamePhase.WAITING) {
            throw new BizException("游戏已开始");
        }

        long firstSpeakDeadline = System.currentTimeMillis() + SPEAK_DURATION_MS;
        room.setDiscussDeadline(firstSpeakDeadline);
        impostorDomainService.assignRoles(room, impostorRepository.loadWordPairs());
        // 初始化发言顺序：随机打乱活跃玩家，第一个发言者随机指派
        impostorDomainService.initSpeakerOrder(room, firstSpeakDeadline);
        impostorRepository.save(room);

        log.info("开始游戏 roomId={}, firstSpeakDeadline={}", roomId, firstSpeakDeadline);
    }

    /**
     * 发送聊天消息：校验讨论阶段 + 当前发言者，添加消息。
     * 顺序发言模式下，只有当前发言者能发消息，其他人需等待轮到自己。
     */
    public void sendChat(String roomId, String playerId, String text) {
        requireNonBlank(text, "消息内容不能为空");
        Room room = requireRoom(roomId);
        Player player = requirePlayer(room, playerId);
        if (room.getPhase() != GamePhase.DISCUSSING) {
            throw new BizException("当前阶段不能发送消息");
        }
        if (player.isEliminated()) {
            throw new BizException("你已被淘汰，无法发送消息");
        }
        // 顺序发言：只有当前发言者能发消息
        String currentSpeaker = room.getCurrentSpeakerId();
        if (currentSpeaker == null) {
            throw new BizException("当前没有发言者");
        }
        if (!currentSpeaker.equals(playerId)) {
            throw new BizException("当前不是你的发言时间，请等待轮到你");
        }

        ChatMessage msg = new ChatMessage(player.getId(), player.getName(), text, System.currentTimeMillis());
        room.addMessage(msg);
        impostorRepository.save(room);
    }

    /**
     * 投票：校验投票阶段、未投过、目标在房间内且活跃。
     */
    public void castVote(String roomId, String playerId, String targetId) {
        requireNonBlank(targetId, "投票目标不能为空");
        Room room = requireRoom(roomId);
        Player voter = requirePlayer(room, playerId);
        if (room.getPhase() != GamePhase.VOTING) {
            throw new BizException("当前阶段不能投票");
        }
        // 已淘汰玩家不能投票
        if (voter.isEliminated()) {
            throw new BizException("你已被淘汰，无法投票");
        }
        if (voter.isVoted()) {
            throw new BizException("你已经投过票了");
        }
        Player target = room.findPlayer(targetId);
        if (target == null) {
            throw new BizException("投票目标不在房间内");
        }
        // 不能投已淘汰玩家
        if (target.isEliminated()) {
            throw new BizException("该玩家已被淘汰");
        }
        if (target.getId().equals(voter.getId())) {
            throw new BizException("不能投自己");
        }

        room.castVote(playerId, targetId);
        room.updatePlayer(voter.withVoted(true).withVoteTarget(targetId));
        impostorRepository.save(room);

        log.info("投票 roomId={}, voter={}, target={}", roomId, playerId, targetId);
    }

    /**
     * 进入投票阶段（校验玩家未淘汰）
     */
    public void startVoting(String roomId, String playerId) {
        Room room = requireRoom(roomId);
        Player player = requirePlayer(room, playerId);
        if (player.isEliminated()) {
            throw new BizException("你已被淘汰，无法操作");
        }
        if (room.getPhase() != GamePhase.DISCUSSING) {
            throw new BizException("当前不在讨论阶段");
        }
        room.startVoting(System.currentTimeMillis() + VOTE_DURATION_MS);
        impostorRepository.save(room);
    }

    /**
     * 轮到下一个发言者：发言超时时调用。
     * 幂等：只有当前发言者截止时间已过才轮转，避免多个客户端同时触发导致跳过玩家。
     * 如果所有人都已发言完毕，自动进入投票阶段。
     */
    public void advanceSpeaker(String roomId) {
        Room room = requireRoom(roomId);
        if (room.getPhase() != GamePhase.DISCUSSING) {
            return;
        }
        // 幂等校验：当前发言者截止时间未到则忽略（防止多客户端重复触发）
        if (room.getSpeakerDeadlineMs() > 0 && System.currentTimeMillis() < room.getSpeakerDeadlineMs()) {
            return;
        }
        long nextDeadline = System.currentTimeMillis() + SPEAK_DURATION_MS;
        boolean hasNext = room.advanceSpeaker(nextDeadline);
        if (!hasNext) {
            // 所有人都发言完了，自动进入投票阶段
            room.startVoting(System.currentTimeMillis() + VOTE_DURATION_MS);
        }
        impostorRepository.save(room);
        log.info("轮转发言者 roomId={}, hasNext={}", roomId, hasNext);
    }

    /**
     * 跳过发言：当前发言者主动结束自己的发言，轮到下一位。
     * 如果所有人都已发言完毕，自动进入投票阶段。
     */
    public void skipSpeaker(String roomId, String playerId) {
        Room room = requireRoom(roomId);
        requirePlayer(room, playerId);
        if (room.getPhase() != GamePhase.DISCUSSING) {
            throw new BizException("当前不在讨论阶段");
        }
        // 只有当前发言者本人才能跳过
        String currentSpeaker = room.getCurrentSpeakerId();
        if (currentSpeaker == null || !currentSpeaker.equals(playerId)) {
            throw new BizException("只有当前发言者才能跳过发言");
        }
        long nextDeadline = System.currentTimeMillis() + SPEAK_DURATION_MS;
        boolean hasNext = room.advanceSpeaker(nextDeadline);
        if (!hasNext) {
            room.startVoting(System.currentTimeMillis() + VOTE_DURATION_MS);
        }
        impostorRepository.save(room);
        log.info("跳过发言 roomId={}, playerId={}, hasNext={}", roomId, playerId, hasNext);
    }

    /**
     * 揭晓：统计票数，根据结果决定游戏结束、进入反猜阶段或进入新一轮。
     * <p>
     * 规则：
     * - 投出冒牌货 → 进入反猜阶段（冒牌货有一次反猜机会），游戏暂不结束
     * - 投出平民 且 活跃玩家 ≤ 2 → 冒牌货胜，游戏结束
     * - 投出平民 且 活跃玩家 > 2 → 该平民被淘汰，进入新一轮讨论
     */
    public RevealDTO reveal(String roomId) {
        Room room = requireRoom(roomId);
        if (room.getPhase() != GamePhase.VOTING) {
            throw new BizException("当前不在投票阶段");
        }

        ImpostorDomainService.VoteResult result = impostorDomainService.tallyVotes(room);

        Player impostor = room.findPlayer(room.getImpostorId());
        Player votedOut = result.votedOutId() == null ? null : room.findPlayer(result.votedOutId());

        // 被投出的是冒牌货：进入反猜阶段，不直接结束游戏
        if (result.isImpostor() && result.votedOutId() != null) {
            long deadline = System.currentTimeMillis() + COUNTER_GUESS_DURATION_MS;
            room.startCounterGuess(deadline);
            impostorRepository.save(room);
            return new RevealDTO(
                    room.getImpostorId(),
                    impostor == null ? null : impostor.getName(),
                    null,
                    null,
                    result.votedOutId(),
                    votedOut == null ? null : votedOut.getName(),
                    false,
                    new ArrayList<>(),
                    false,
                    true,
                    deadline
            );
        }

        // 被投出的是平民或无人被投出
        boolean gameOver = result.gameOver();
        List<String> winnerIds = gameOver ? computeWinners(room, result.isImpostor()) : new ArrayList<>();

        if (gameOver) {
            room.reveal();
        } else {
            if (result.votedOutId() != null) {
                room.eliminatePlayer(result.votedOutId());
            }
            long firstSpeakDeadline = System.currentTimeMillis() + SPEAK_DURATION_MS;
            room.startNextRound(firstSpeakDeadline);
            // 重新初始化发言顺序（排除已淘汰玩家）
            impostorDomainService.initSpeakerOrder(room, firstSpeakDeadline);
        }
        impostorRepository.save(room);

        return new RevealDTO(
                room.getImpostorId(),
                impostor == null ? null : impostor.getName(),
                room.getSecretWord(),
                room.getImpostorWord(),
                result.votedOutId(),
                votedOut == null ? null : votedOut.getName(),
                result.isImpostor(),
                winnerIds,
                gameOver,
                false,
                null
        );
    }

    /**
     * 冒牌货反猜：冒牌货被投出后有一次反猜平民秘密词的机会。
     * <p>
     * 规则：
     * - 仅在反猜阶段可用，且仅被投出的冒牌货本人可发起
     * - 猜对（忽略大小写与首尾空格）：冒牌货胜利，游戏结束
     * - 猜错：平民胜利，游戏结束
     *
     * @return RevealDTO（gameOver=true，终局揭晓）
     */
    public RevealDTO counterGuess(String roomId, String playerId, String guessWord) {
        requireNonBlank(guessWord, "猜测的词不能为空");
        Room room = requireRoom(roomId);
        requirePlayer(room, playerId);
        if (!room.isCounterGuessPhase()) {
            throw new BizException("当前不在反猜阶段");
        }
        if (room.getImpostorId() == null || !room.getImpostorId().equals(playerId)) {
            throw new BizException("只有被投出的冒牌货才能反猜");
        }

        // 反猜阶段结束
        room.setCounterGuessPhase(false);
        room.reveal();

        String normalizedSecret = room.getSecretWord() == null ? "" : room.getSecretWord().trim();
        String normalizedGuess = guessWord.trim();
        boolean correct = !normalizedSecret.isEmpty() && normalizedSecret.equalsIgnoreCase(normalizedGuess);

        Player impostor = room.findPlayer(room.getImpostorId());
        List<String> winnerIds = new ArrayList<>();
        boolean impostorCaught;

        if (correct) {
            // 冒牌货反猜成功：冒牌货胜利
            for (Player p : room.getPlayers()) {
                if (p.getRole() == ImpostorRole.IMPOSTOR) {
                    winnerIds.add(p.getId());
                }
            }
            impostorCaught = false;
        } else {
            // 冒牌货反猜失败：平民胜利
            for (Player p : room.getPlayers()) {
                if (p.getRole() == ImpostorRole.CIVILIAN) {
                    winnerIds.add(p.getId());
                }
            }
            impostorCaught = true;
        }

        impostorRepository.save(room);
        return new RevealDTO(
                room.getImpostorId(),
                impostor == null ? null : impostor.getName(),
                room.getSecretWord(),
                room.getImpostorWord(),
                playerId,
                impostor == null ? null : impostor.getName(),
                impostorCaught,
                winnerIds,
                true,
                false,
                null
        );
    }

    /**
     * 反猜超时：冒牌货未在规定时间内反猜，平民胜利。
     *
     * @return RevealDTO（gameOver=true，终局揭晓）
     */
    public RevealDTO timeoutCounterGuess(String roomId) {
        Room room = requireRoom(roomId);
        if (!room.isCounterGuessPhase()) {
            throw new BizException("当前不在反猜阶段");
        }
        room.setCounterGuessPhase(false);
        room.reveal();

        Player impostor = room.findPlayer(room.getImpostorId());
        List<String> winnerIds = new ArrayList<>();
        for (Player p : room.getPlayers()) {
            if (p.getRole() == ImpostorRole.CIVILIAN) {
                winnerIds.add(p.getId());
            }
        }
        impostorRepository.save(room);
        return new RevealDTO(
                room.getImpostorId(),
                impostor == null ? null : impostor.getName(),
                room.getSecretWord(),
                room.getImpostorWord(),
                room.getImpostorId(),
                impostor == null ? null : impostor.getName(),
                true,
                winnerIds,
                true,
                false,
                null
        );
    }

    /**
     * 重置房间：房主触发，回到 WAITING 阶段。
     */
    public void restart(String roomId, String hostId) {
        Room room = requireRoom(roomId);
        requireHost(room, hostId);
        room.reset();
        impostorRepository.save(room);

        log.info("重置房间 roomId={}", roomId);
    }

    /**
     * 处理玩家离线：标记 online=false。
     */
    public void handlePlayerDisconnect(String roomId, String playerId) {
        Room room = impostorRepository.findById(roomId);
        if (room == null) {
            return;
        }
        Player player = room.findPlayer(playerId);
        if (player == null) {
            return;
        }
        room.updatePlayer(player.withOnline(false));
        impostorRepository.save(room);

        log.info("玩家离线 roomId={}, playerId={}", roomId, playerId);
    }

    /**
     * 查询玩家角色（用于 WebSocket 推送 ROLE）
     * <p>
     * 平民拿到秘密词；冒牌货拿到近似词。两者界面一致，不暴露身份。
     */
    public RoleDTO getRole(String roomId, String playerId) {
        Room room = requireRoom(roomId);
        Player player = requirePlayer(room, playerId);
        if (player.getRole() == null) {
            return new RoleDTO(null, null);
        }
        String role = player.getRole().name();
        // 平民拿秘密词，冒牌货拿近似词
        String word = player.getRole() == ImpostorRole.IMPOSTOR
                ? room.getImpostorWord()
                : room.getSecretWord();
        return new RoleDTO(role, word);
    }

    /**
     * 查询全量游戏状态
     * <p>
     * 房间不存在时返回 null（而非抛异常），用于 WebSocket 广播时容错：
     * 连接关闭后房间可能已被回收，此时广播状态应静默跳过。
     */
    public GameStateDTO getGameState(String roomId) {
        Room room = impostorRepository.findById(roomId);
        if (room == null) {
            return null;
        }
        return ImpostorAssembler.toGameStateDTO(room);
    }

    /**
     * 判断是否所有活跃（未淘汰）在线玩家都已投票。
     * <p>
     * 已淘汰玩家的 voted 状态在新一轮会被重置为 false，不应参与判定，
     * 否则第二轮投票完成后会因被淘汰玩家未投票而永远无法触发揭晓。
     */
    public boolean allVoted(String roomId) {
        Room room = impostorRepository.findById(roomId);
        if (room == null) {
            return false;
        }
        return room.getPlayers().stream()
                .filter(p -> p.isOnline() && !p.isEliminated())
                .allMatch(Player::isVoted);
    }

    // ---------- 私有辅助方法 ----------

    private Room requireRoom(String roomId) {
        Room room = impostorRepository.findById(roomId);
        if (room == null) {
            throw new BizException("房间不存在");
        }
        return room;
    }

    private Player requirePlayer(Room room, String playerId) {
        Player player = room.findPlayer(playerId);
        if (player == null) {
            throw new BizException("玩家不在房间内");
        }
        return player;
    }

    private void requireHost(Room room, String playerId) {
        if (!room.isHost(playerId)) {
            throw new BizException("仅房主可执行此操作");
        }
    }

    private void requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BizException(message);
        }
    }

    /**
     * 计算胜利者 id 列表：
     * - 冒牌货被抓住 → 全体平民胜利
     * - 冒牌货未被抓 → 冒牌货胜利
     */
    private List<String> computeWinners(Room room, boolean impostorCaught) {
        List<String> winners = new ArrayList<>();
        for (Player p : room.getPlayers()) {
            if (impostorCaught) {
                if (p.getRole() == ImpostorRole.CIVILIAN) {
                    winners.add(p.getId());
                }
            } else {
                if (p.getRole() == ImpostorRole.IMPOSTOR) {
                    winners.add(p.getId());
                }
            }
        }
        return winners;
    }

    /**
     * 生成 6 位纯数字随机串
     */
    private String generateRoomId() {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(ROOM_ID_CHARS[random.nextInt(ROOM_ID_CHARS.length)]);
        }
        return sb.toString();
    }
}

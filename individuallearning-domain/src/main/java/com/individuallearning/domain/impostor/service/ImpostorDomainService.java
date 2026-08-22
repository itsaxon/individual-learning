package com.individuallearning.domain.impostor.service;

import com.individuallearning.domain.impostor.model.Player;
import com.individuallearning.domain.impostor.model.Room;
import com.individuallearning.domain.impostor.model.valobj.ImpostorRole;
import com.individuallearning.domain.impostor.model.valobj.WordPair;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 找出冒牌货领域服务：承载角色分配、票数统计等核心领域规则。
 * <p>
 * 纯 POJO，由基础设施层装配为 Spring Bean。
 */
public class ImpostorDomainService {

    /** 词对为空时的兜底词对 */
    private static final WordPair FALLBACK_PAIR = new WordPair("苹果", "梨子");

    /**
     * 分配角色：从词对列表随机选一对近似词，随机决定哪个词给平民/冒牌货，
     * 从玩家中随机选一个冒牌货，并设置每个玩家的 role。
     *
     * @param room      房间聚合根
     * @param wordPairs 词对列表
     */
    public void assignRoles(Room room, List<WordPair> wordPairs) {
        if (room == null || room.getPlayers().isEmpty()) {
            return;
        }
        // 使用 SecureRandom 而非 ThreadLocalRandom，避免线程内连续调用时
        // 可能出现的分布偏差，确保冒牌货是真正随机选择的
        SecureRandom random = new SecureRandom();

        WordPair pair = (wordPairs == null || wordPairs.isEmpty())
                ? FALLBACK_PAIR
                : wordPairs.get(random.nextInt(wordPairs.size()));

        // 随机决定哪个词给平民（秘密词），哪个给冒牌货（近似词）
        String secretWord = pair.wordA();
        String impostorWord = pair.wordB();
        if (random.nextBoolean()) {
            secretWord = pair.wordB();
            impostorWord = pair.wordA();
        }

        // 打乱玩家顺序后再选第一个作为冒牌货，确保随机性不依赖列表原始顺序
        List<Player> players = new ArrayList<>(room.getPlayers());
        Collections.shuffle(players, random);
        Player impostor = players.get(0);

        // 设置每个玩家角色并替换（注意：这里遍历的是打乱后的列表，
        // 但 room.updatePlayer 会按 id 原地替换，不影响房间内玩家顺序）
        List<Player> updated = new ArrayList<>();
        for (Player p : players) {
            ImpostorRole role = p.getId().equals(impostor.getId())
                    ? ImpostorRole.IMPOSTOR
                    : ImpostorRole.CIVILIAN;
            updated.add(p.withRole(role));
        }
        for (Player p : updated) {
            room.updatePlayer(p);
        }

        // 设置房间秘密词、冒牌货词与冒牌货 id，并进入讨论阶段
        room.setupGame(secretWord, impostorWord, impostor.getId(), room.getPhaseDeadlineMs());
    }

    /**
     * 初始化发言顺序：随机打乱活跃玩家列表作为发言顺序，第一个发言者随机指派。
     *
     * @param room            房间聚合根
     * @param firstDeadlineMs 第一个发言者的截止时间戳
     */
    public void initSpeakerOrder(Room room, long firstDeadlineMs) {
        if (room == null || room.getPlayers().isEmpty()) {
            return;
        }
        SecureRandom random = new SecureRandom();
        List<String> order = new ArrayList<>();
        for (Player p : room.getActivePlayers()) {
            order.add(p.getId());
        }
        Collections.shuffle(order, random);
        room.initSpeakerOrder(order, firstDeadlineMs);
    }

    /**
     * 统计票数，返回被投出的人 id。
     * <p>
     * 规则：得票最多者被投出；平票则从中随机选一个；无人投票返回 null。
     * 仅统计活跃（未淘汰）玩家的投票。
     *
     * @param room 房间聚合根
     * @return 投票结果
     */
    public VoteResult tallyVotes(Room room) {
        if (room == null) {
            return new VoteResult(null, false, Collections.emptyMap(), false);
        }
        Map<String, String> votes = room.getVotes();
        if (votes.isEmpty()) {
            return new VoteResult(null, false, Collections.emptyMap(), false);
        }

        // 收集活跃玩家 id 集合（仅活跃玩家投票有效）
        java.util.Set<String> activeIds = new java.util.HashSet<>();
        for (Player p : room.getActivePlayers()) {
            activeIds.add(p.getId());
        }

        // 统计每个被投目标的票数（仅活跃玩家投出的票，且目标必须也是活跃玩家）
        Map<String, Integer> voteCount = new HashMap<>();
        for (Map.Entry<String, String> e : votes.entrySet()) {
            String voterId = e.getKey();
            String targetId = e.getValue();
            if (targetId == null) {
                continue;
            }
            // 投票者必须是活跃玩家
            if (!activeIds.contains(voterId)) {
                continue;
            }
            // 投票目标必须是活跃玩家（已淘汰玩家不能被投出）
            if (!activeIds.contains(targetId)) {
                continue;
            }
            voteCount.merge(targetId, 1, Integer::sum);
        }
        if (voteCount.isEmpty()) {
            return new VoteResult(null, false, Collections.emptyMap(), false);
        }

        // 找出最高票
        int max = Collections.max(voteCount.values());
        List<String> topCandidates = new ArrayList<>();
        for (Map.Entry<String, Integer> e : voteCount.entrySet()) {
            if (e.getValue() == max) {
                topCandidates.add(e.getKey());
            }
        }

        // 平票随机选一个（使用 SecureRandom 保证随机性）
        String votedOutId = topCandidates.size() == 1
                ? topCandidates.get(0)
                : topCandidates.get(new SecureRandom().nextInt(topCandidates.size()));

        boolean isImpostor = votedOutId.equals(room.getImpostorId());
        // 判断游戏是否应当结束：
        // - 冒牌货被投出 → 不直接结束，由 reveal 方法进入反猜阶段
        // - 平民被投出 且 淘汰该平民后活跃玩家 ≤ 2 → 游戏结束（冒牌货胜利）
        //   注意：必须按「淘汰后」的活跃玩家数判断，否则 3 人时投出平民后
        //         还会进入新一轮讨论，但此时仅剩 2 人，游戏应当直接结束。
        boolean gameOver;
        if (isImpostor) {
            gameOver = false;
        } else {
            long activeAfterEliminate = 0;
            for (Player p : room.getActivePlayers()) {
                if (!p.getId().equals(votedOutId)) {
                    activeAfterEliminate++;
                }
            }
            gameOver = activeAfterEliminate <= 2;
        }
        return new VoteResult(votedOutId, isImpostor, voteCount, gameOver);
    }

    /**
     * 投票统计结果
     *
     * @param votedOutId  被投出的玩家 id（null 表示无人投票）
     * @param isImpostor  被投出者是否为冒牌货
     * @param voteCount   每个被投目标的票数
     * @param gameOver    游戏是否应当结束（冒牌货被抓 或 活跃玩家 ≤ 2）
     */
    public record VoteResult(String votedOutId, boolean isImpostor, Map<String, Integer> voteCount, boolean gameOver) {
    }
}

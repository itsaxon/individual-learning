package com.individuallearning.application.impostor.dto;

import java.util.List;
import java.util.Map;

/**
 * 全量游戏状态视图（不含秘密词和角色，避免泄露）。
 *
 * @param phase              游戏阶段
 * @param players            玩家列表
 * @param deadlineMs         当前阶段截止时间戳（毫秒）
 * @param votes              投票映射（voterId → targetId）
 * @param hostId             房主 id
 * @param discussSeconds     讨论阶段时长（秒）
 * @param voteSeconds        投票阶段时长（秒）
 * @param currentSpeakerId   当前发言者 id（讨论阶段顺序发言）
 * @param speakerDeadlineMs  当前发言者截止时间戳
 * @param speakerOrder       发言顺序（玩家 id 列表）
 */
public record GameStateDTO(
        String phase,
        List<PlayerDTO> players,
        Long deadlineMs,
        Map<String, String> votes,
        String hostId,
        Integer discussSeconds,
        Integer voteSeconds,
        String currentSpeakerId,
        Long speakerDeadlineMs,
        List<String> speakerOrder
) {
}

package com.individuallearning.application.impostor.dto;

import java.util.List;

/**
 * 揭晓信息
 *
 * @param impostorId              冒牌货玩家 id
 * @param impostorName            冒牌货昵称
 * @param secretWord              平民的秘密词（反猜阶段不暴露）
 * @param impostorWord            冒牌货拿到的近似词（反猜阶段不暴露）
 * @param votedOutId              被投出的玩家 id（可能为 null）
 * @param votedOutName            被投出的玩家昵称（可能为 null）
 * @param impostorCaught          冒牌货是否被抓住
 * @param winnerIds               胜利玩家 id 列表（游戏未结束时为空）
 * @param gameOver                游戏是否结束
 * @param counterGuessPhase       是否处于反猜阶段（冒牌货被投出后有一次反猜机会）
 * @param counterGuessDeadlineMs  反猜阶段截止时间戳（反猜阶段才有值）
 */
public record RevealDTO(
        String impostorId,
        String impostorName,
        String secretWord,
        String impostorWord,
        String votedOutId,
        String votedOutName,
        boolean impostorCaught,
        List<String> winnerIds,
        boolean gameOver,
        boolean counterGuessPhase,
        Long counterGuessDeadlineMs
) {
}

package com.individuallearning.application.impostor.dto;

import java.util.List;

/**
 * 加入房间结果
 *
 * @param roomId   房间 id
 * @param playerId 当前玩家 id
 * @param players  房间内全部玩家列表
 */
public record JoinRoomResultDTO(String roomId, String playerId, List<PlayerDTO> players) {
}

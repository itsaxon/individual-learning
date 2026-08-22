package com.individuallearning.application.impostor.dto;

/**
 * 创建房间结果
 *
 * @param roomId   房间 id
 * @param playerId 房主玩家 id
 */
public record CreateRoomResultDTO(String roomId, String playerId) {
}

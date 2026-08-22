package com.individuallearning.application.impostor.dto;

import java.util.List;

/**
 * 房间视图
 *
 * @param roomId      房间 id
 * @param hostId      房主 id
 * @param players     玩家列表
 * @param phase       游戏阶段
 * @param playerCount 当前玩家数
 * @param canStart    是否可开始游戏
 */
public record RoomDTO(String roomId, String hostId, List<PlayerDTO> players, String phase, int playerCount, boolean canStart) {
}

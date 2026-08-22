package com.individuallearning.application.impostor.command;

/**
 * 加入房间命令
 *
 * @param roomId     房间 id
 * @param playerName 玩家昵称
 */
public record JoinRoomCommand(String roomId, String playerName) {
}

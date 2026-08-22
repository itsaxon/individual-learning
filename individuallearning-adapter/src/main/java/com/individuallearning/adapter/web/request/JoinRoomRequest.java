package com.individuallearning.adapter.web.request;

import com.individuallearning.application.impostor.command.JoinRoomCommand;
import jakarta.validation.constraints.NotBlank;

/**
 * 加入房间请求
 *
 * @param roomId     房间号
 * @param playerName 玩家昵称
 */
public record JoinRoomRequest(
        @NotBlank(message = "房间号不能为空") String roomId,
        @NotBlank(message = "玩家昵称不能为空") String playerName) {

    public JoinRoomCommand toCommand() {
        return new JoinRoomCommand(roomId, playerName);
    }
}

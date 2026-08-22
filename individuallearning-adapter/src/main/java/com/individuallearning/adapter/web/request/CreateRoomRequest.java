package com.individuallearning.adapter.web.request;

import com.individuallearning.application.impostor.command.CreateRoomCommand;
import jakarta.validation.constraints.NotBlank;

/**
 * 创建房间请求
 *
 * @param playerName 房主昵称
 */
public record CreateRoomRequest(
        @NotBlank(message = "玩家昵称不能为空") String playerName) {

    public CreateRoomCommand toCommand() {
        return new CreateRoomCommand(playerName);
    }
}

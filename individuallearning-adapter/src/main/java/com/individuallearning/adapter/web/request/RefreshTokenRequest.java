package com.individuallearning.adapter.web.request;

import com.individuallearning.application.auth.command.RefreshTokenCommand;
import jakarta.validation.constraints.NotBlank;

/**
 * 刷新令牌请求
 */
public record RefreshTokenRequest(
        @NotBlank(message = "刷新令牌不能为空") String refreshToken) {

    public RefreshTokenCommand toCommand() {
        return new RefreshTokenCommand(refreshToken);
    }
}

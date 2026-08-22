package com.individuallearning.adapter.web.request;

import com.individuallearning.application.system.command.ChangePasswordCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 修改密码请求
 */
public record ChangePasswordRequest(
        @NotNull(message = "用户ID不能为空") Long userId,
        @NotBlank(message = "原密码不能为空") String oldPassword,
        @NotBlank(message = "新密码不能为空")
        @Size(min = 8, max = 32, message = "密码长度需在8-32位之间") String newPassword) {

    public ChangePasswordCommand toCommand() {
        return new ChangePasswordCommand(userId, oldPassword, newPassword);
    }
}

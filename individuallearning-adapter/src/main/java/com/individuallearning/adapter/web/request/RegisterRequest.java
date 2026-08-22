package com.individuallearning.adapter.web.request;

import com.individuallearning.application.system.command.RegisterCommand;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 注册请求
 */
public record RegisterRequest(
        @NotBlank(message = "用户名不能为空")
        @Pattern(regexp = "^[a-zA-Z][a-zA-Z0-9_]{2,19}$", message = "用户名以字母开头，仅含字母数字下划线，长度3-20")
        String username,

        @NotBlank(message = "密码不能为空")
        @Size(min = 8, max = 32, message = "密码长度需在8-32位之间")
        String password,

        @NotBlank(message = "邮箱不能为空")
        @Email(message = "邮箱格式不正确")
        String email) {

    public RegisterCommand toCommand() {
        return new RegisterCommand(username, password, email);
    }
}

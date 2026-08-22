package com.individuallearning.adapter.web.request;

import com.individuallearning.application.auth.command.AuthLoginCommand;
import jakarta.validation.constraints.NotBlank;

/**
 * 认证登录请求
 */
public record AuthLoginRequest(
        @NotBlank(message = "用户名不能为空") String username,
        @NotBlank(message = "密码不能为空") String password) {

    /**
     * 转换为登录命令，loginIp 由控制器从请求上下文获取后传入
     */
    public AuthLoginCommand toCommand(String loginIp) {
        return new AuthLoginCommand(username, password, loginIp);
    }
}

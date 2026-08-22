package com.individuallearning.application.auth.command;

/**
 * 认证登录命令
 */
public record AuthLoginCommand(String username, String password, String loginIp) {
}

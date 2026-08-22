package com.individuallearning.application.system.command;

/**
 * 用户注册命令
 */
public record RegisterCommand(String username, String password, String email) {
}

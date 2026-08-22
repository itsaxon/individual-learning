package com.individuallearning.application.system.command;

/**
 * 修改密码命令
 */
public record ChangePasswordCommand(Long userId, String oldPassword, String newPassword) {
}

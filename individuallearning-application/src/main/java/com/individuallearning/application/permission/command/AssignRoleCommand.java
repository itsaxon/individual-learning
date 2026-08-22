package com.individuallearning.application.permission.command;

/**
 * 分配/撤销角色命令
 */
public record AssignRoleCommand(Long userId, Long roleId) {
}

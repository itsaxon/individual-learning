package com.individuallearning.application.permission.command;

/**
 * 更新角色命令
 */
public record UpdateRoleCommand(Long roleId, String name, String description) {
}

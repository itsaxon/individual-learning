package com.individuallearning.application.permission.command;

/**
 * 授予/撤销权限命令
 */
public record GrantPermissionCommand(Long roleId, Long permissionId) {
}

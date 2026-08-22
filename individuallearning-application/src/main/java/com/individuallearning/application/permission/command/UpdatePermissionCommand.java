package com.individuallearning.application.permission.command;

/**
 * 更新权限命令
 */
public record UpdatePermissionCommand(Long permissionId, String name, Long parentId, Integer sort) {
}

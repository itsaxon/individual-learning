package com.individuallearning.application.permission.command;

/**
 * 创建权限命令
 */
public record CreatePermissionCommand(String code, String name, Integer type, Long parentId, Integer sort) {
}

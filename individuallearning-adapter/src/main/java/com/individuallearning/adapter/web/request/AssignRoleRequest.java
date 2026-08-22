package com.individuallearning.adapter.web.request;

import com.individuallearning.application.permission.command.AssignRoleCommand;
import jakarta.validation.constraints.NotNull;

/**
 * 分配角色请求
 */
public record AssignRoleRequest(
        @NotNull(message = "角色ID不能为空")
        Long roleId) {

    public AssignRoleCommand toCommand(Long userId) {
        return new AssignRoleCommand(userId, roleId);
    }
}

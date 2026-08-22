package com.individuallearning.adapter.web.request;

import com.individuallearning.application.permission.command.GrantPermissionCommand;
import jakarta.validation.constraints.NotNull;

/**
 * 授予权限请求
 */
public record GrantPermissionRequest(
        @NotNull(message = "权限ID不能为空")
        Long permissionId) {

    public GrantPermissionCommand toCommand(Long roleId) {
        return new GrantPermissionCommand(roleId, permissionId);
    }
}

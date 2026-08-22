package com.individuallearning.adapter.web.request;

import com.individuallearning.application.permission.command.UpdatePermissionCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 更新权限请求
 */
public record UpdatePermissionRequest(
        @NotBlank(message = "权限名称不能为空")
        @Size(max = 64, message = "权限名称长度不能超过64")
        String name,

        Long parentId,

        Integer sort) {

    public UpdatePermissionCommand toCommand(Long permissionId) {
        return new UpdatePermissionCommand(permissionId, name, parentId, sort);
    }
}

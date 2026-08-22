package com.individuallearning.adapter.web.request;

import com.individuallearning.application.permission.command.UpdateRoleCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 更新角色请求
 */
public record UpdateRoleRequest(
        @NotBlank(message = "角色名称不能为空")
        @Size(max = 64, message = "角色名称长度不能超过64")
        String name,

        @Size(max = 255, message = "描述长度不能超过255")
        String description) {

    public UpdateRoleCommand toCommand(Long roleId) {
        return new UpdateRoleCommand(roleId, name, description);
    }
}

package com.individuallearning.adapter.web.request;

import com.individuallearning.application.permission.command.CreateRoleCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 创建角色请求
 */
public record CreateRoleRequest(
        @NotBlank(message = "角色编码不能为空")
        @Pattern(regexp = "^[A-Z][A-Z0-9_]{2,29}$", message = "角色编码以大写字母开头，仅含大写字母数字下划线，长度3-30")
        String code,

        @NotBlank(message = "角色名称不能为空")
        @Size(max = 64, message = "角色名称长度不能超过64")
        String name,

        @Size(max = 255, message = "描述长度不能超过255")
        String description) {

    public CreateRoleCommand toCommand() {
        return new CreateRoleCommand(code, name, description);
    }
}

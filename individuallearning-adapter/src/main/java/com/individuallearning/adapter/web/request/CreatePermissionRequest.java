package com.individuallearning.adapter.web.request;

import com.individuallearning.application.permission.command.CreatePermissionCommand;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 创建权限请求
 */
public record CreatePermissionRequest(
        @NotBlank(message = "权限编码不能为空")
        @Pattern(regexp = "^[a-z][a-z0-9:._-]{2,63}$", message = "权限编码以小写字母开头，仅含小写字母数字和 : . _ - 符号，长度3-64")
        String code,

        @NotBlank(message = "权限名称不能为空")
        @Size(max = 64, message = "权限名称长度不能超过64")
        String name,

        @NotNull(message = "权限类型不能为空")
        @Min(value = 1, message = "权限类型必须为1-3")
        @Max(value = 3, message = "权限类型必须为1-3")
        Integer type,

        Long parentId,

        Integer sort) {

    public CreatePermissionCommand toCommand() {
        return new CreatePermissionCommand(code, name, type, parentId, sort);
    }
}

package com.individuallearning.adapter.web.controller;

import com.individuallearning.adapter.web.request.AssignRoleRequest;
import com.individuallearning.adapter.web.request.CreateRoleRequest;
import com.individuallearning.adapter.web.request.GrantPermissionRequest;
import com.individuallearning.adapter.web.request.UpdateRoleRequest;
import com.individuallearning.application.permission.dto.RoleDTO;
import com.individuallearning.application.permission.service.RoleApplicationService;
import com.individuallearning.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 角色管理接口
 * <p>
 * 类级使用 @RequestMapping("/api/v1") 作为 API 版本前缀，
 * 因角色资源（/role）与用户-角色分配（/user）前缀不同，方法级各自显式声明资源路径。
 */
@Tag(name = "角色管理", description = "角色创建、更新、授权、用户分配等")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RoleController {

    private final RoleApplicationService roleApplicationService;

    @Operation(summary = "创建角色")
    @PostMapping("/role")
    public ApiResponse<RoleDTO> createRole(@RequestBody @Valid CreateRoleRequest request) {
        return ApiResponse.success(roleApplicationService.createRole(request.toCommand()));
    }

    @Operation(summary = "更新角色")
    @PutMapping("/role/{roleId}")
    public ApiResponse<RoleDTO> updateRole(@PathVariable Long roleId, @RequestBody @Valid UpdateRoleRequest request) {
        return ApiResponse.success(roleApplicationService.updateRole(request.toCommand(roleId)));
    }

    @Operation(summary = "查看角色")
    @GetMapping("/role/{roleId}")
    public ApiResponse<RoleDTO> getRole(@PathVariable Long roleId) {
        return ApiResponse.success(roleApplicationService.getRole(roleId));
    }

    @Operation(summary = "查询所有角色")
    @GetMapping("/role")
    public ApiResponse<List<RoleDTO>> listRoles() {
        return ApiResponse.success(roleApplicationService.listRoles());
    }

    @Operation(summary = "授予角色权限")
    @PostMapping("/role/{roleId}/permission")
    public ApiResponse<Void> grantPermission(@PathVariable Long roleId, @RequestBody @Valid GrantPermissionRequest request) {
        roleApplicationService.grantPermission(request.toCommand(roleId));
        return ApiResponse.success();
    }

    @Operation(summary = "撤销角色权限")
    @DeleteMapping("/role/{roleId}/permission/{permissionId}")
    public ApiResponse<Void> revokePermission(@PathVariable Long roleId, @PathVariable Long permissionId) {
        roleApplicationService.revokePermission(roleId, permissionId);
        return ApiResponse.success();
    }

    @Operation(summary = "给用户分配角色")
    @PostMapping("/user/{userId}/role")
    public ApiResponse<Void> assignRole(@PathVariable Long userId, @RequestBody @Valid AssignRoleRequest request) {
        roleApplicationService.assignRole(request.toCommand(userId));
        return ApiResponse.success();
    }

    @Operation(summary = "撤销用户的角色")
    @DeleteMapping("/user/{userId}/role/{roleId}")
    public ApiResponse<Void> revokeRole(@PathVariable Long userId, @PathVariable Long roleId) {
        roleApplicationService.revokeRole(userId, roleId);
        return ApiResponse.success();
    }
}

package com.individuallearning.adapter.web.controller;

import com.individuallearning.adapter.web.request.CreatePermissionRequest;
import com.individuallearning.adapter.web.request.UpdatePermissionRequest;
import com.individuallearning.application.permission.dto.PermissionDTO;
import com.individuallearning.application.permission.service.PermissionApplicationService;
import com.individuallearning.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 权限管理接口
 */
@Tag(name = "权限管理", description = "权限创建、更新、查询等")
@RestController
@RequestMapping("/api/v1/permission")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionApplicationService permissionApplicationService;

    @Operation(summary = "创建权限")
    @PostMapping
    public ApiResponse<PermissionDTO> createPermission(@RequestBody @Valid CreatePermissionRequest request) {
        return ApiResponse.success(permissionApplicationService.createPermission(request.toCommand()));
    }

    @Operation(summary = "更新权限")
    @PutMapping("/{permissionId}")
    public ApiResponse<PermissionDTO> updatePermission(@PathVariable Long permissionId,
                                                   @RequestBody @Valid UpdatePermissionRequest request) {
        return ApiResponse.success(permissionApplicationService.updatePermission(request.toCommand(permissionId)));
    }

    @Operation(summary = "查看权限")
    @GetMapping("/{permissionId}")
    public ApiResponse<PermissionDTO> getPermission(@PathVariable Long permissionId) {
        return ApiResponse.success(permissionApplicationService.getPermission(permissionId));
    }

    @Operation(summary = "查询所有权限")
    @GetMapping
    public ApiResponse<List<PermissionDTO>> listPermissions() {
        return ApiResponse.success(permissionApplicationService.listPermissions());
    }
}

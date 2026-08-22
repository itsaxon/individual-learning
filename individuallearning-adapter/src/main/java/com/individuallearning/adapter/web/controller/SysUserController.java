package com.individuallearning.adapter.web.controller;

import com.individuallearning.adapter.web.request.ChangePasswordRequest;
import com.individuallearning.adapter.web.request.LoginRequest;
import com.individuallearning.adapter.web.request.RegisterRequest;
import com.individuallearning.application.system.dto.SysUserDTO;
import com.individuallearning.application.system.service.SysUserApplicationService;
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

/**
 * 系统用户接口
 */
@Tag(name = "系统用户", description = "用户注册、登录、密码、启停等")
@RestController
@RequestMapping("/api/v1/sys/user")
@RequiredArgsConstructor
public class SysUserController {

    private final SysUserApplicationService sysUserApplicationService;

    @Operation(summary = "注册")
    @PostMapping("/register")
    public ApiResponse<SysUserDTO> register(@RequestBody @Valid RegisterRequest request) {
        return ApiResponse.success(sysUserApplicationService.register(request.toCommand()));
    }

    @Operation(summary = "登录")
    @PostMapping("/login")
    public ApiResponse<SysUserDTO> login(@RequestBody @Valid LoginRequest request) {
        return ApiResponse.success(sysUserApplicationService.login(request.toCommand()));
    }

    @Operation(summary = "修改密码")
    @PutMapping("/password")
    public ApiResponse<Void> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        sysUserApplicationService.changePassword(request.toCommand());
        return ApiResponse.success();
    }

    @Operation(summary = "查看用户信息")
    @GetMapping("/{userId}")
    public ApiResponse<SysUserDTO> profile(@PathVariable Long userId) {
        return ApiResponse.success(sysUserApplicationService.getProfile(userId));
    }

    @Operation(summary = "禁用用户")
    @PutMapping("/{userId}/disable")
    public ApiResponse<Void> disable(@PathVariable Long userId) {
        sysUserApplicationService.disable(userId);
        return ApiResponse.success();
    }

    @Operation(summary = "启用用户")
    @PutMapping("/{userId}/enable")
    public ApiResponse<Void> enable(@PathVariable Long userId) {
        sysUserApplicationService.enable(userId);
        return ApiResponse.success();
    }
}

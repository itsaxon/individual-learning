package com.individuallearning.adapter.web.controller;

import com.individuallearning.adapter.web.request.AuthLoginRequest;
import com.individuallearning.adapter.web.request.RefreshTokenRequest;
import com.individuallearning.application.auth.dto.TokenDTO;
import com.individuallearning.application.auth.service.AuthApplicationService;
import com.individuallearning.common.api.ApiResponse;
import com.individuallearning.common.api.ResponseCode;
import com.individuallearning.common.exception.BizException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证接口
 */
@Tag(name = "认证", description = "登录、登出、刷新令牌等")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthApplicationService authApplicationService;

    @Operation(summary = "登录")
    @PostMapping("/login")
    public ApiResponse<TokenDTO> login(@RequestBody @Valid AuthLoginRequest request, HttpServletRequest httpRequest) {
        return ApiResponse.success(authApplicationService.login(request.toCommand(extractClientIp(httpRequest))));
    }

    @Operation(summary = "刷新令牌")
    @PostMapping("/refresh")
    public ApiResponse<TokenDTO> refresh(@RequestBody @Valid RefreshTokenRequest request) {
        return ApiResponse.success(authApplicationService.refresh(request.toCommand()));
    }

    @Operation(summary = "登出")
    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        String accessToken = extractBearerToken(authorization);
        if (accessToken == null || accessToken.isBlank()) {
            throw new BizException(ResponseCode.UNAUTHORIZED);
        }
        authApplicationService.logout(accessToken);
        return ApiResponse.success();
    }

    private String extractBearerToken(String authorization) {
        if (authorization == null || authorization.isBlank()) {
            return null;
        }
        String trimmed = authorization.trim();
        if (trimmed.toLowerCase().startsWith("bearer ")) {
            return trimmed.substring(7).trim();
        }
        return trimmed;
    }

    /**
     * 从请求中解析客户端 IP：优先取 X-Forwarded-For 首段，回退到 remoteAddr。
     */
    private String extractClientIp(HttpServletRequest httpRequest) {
        String xff = httpRequest.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            String ip = (comma > 0 ? xff.substring(0, comma) : xff).trim();
            if (!ip.isEmpty()) {
                return ip;
            }
        }
        return httpRequest.getRemoteAddr();
    }
}

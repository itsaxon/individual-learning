package com.individuallearning.adapter.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.individuallearning.adapter.common.GlobalExceptionHandler;
import com.individuallearning.adapter.web.request.LoginRequest;
import com.individuallearning.adapter.web.request.RegisterRequest;
import com.individuallearning.application.system.dto.SysUserDTO;
import com.individuallearning.application.system.service.SysUserApplicationService;
import com.individuallearning.common.api.ResponseCode;
import com.individuallearning.domain.auth.service.TokenGenerator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SysUserController Web 切片测试：验证接口入参校验与响应结构，不依赖数据库。
 */
@WebMvcTest(controllers = SysUserController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class SysUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SysUserApplicationService sysUserApplicationService;

    /** JwtAuthenticationFilter 依赖 TokenGenerator，切片测试中提供 Mock */
    @MockBean
    private TokenGenerator tokenGenerator;

    @Test
    @DisplayName("register：有效请求返回 200 + ApiResponse.success")
    void register_validRequest_shouldReturn200() throws Exception {
        RegisterRequest request = new RegisterRequest("alice", "password123", "alice@example.com");
        SysUserDTO dto = new SysUserDTO(1L, "alice", "alice@example.com", "alice", 1, Instant.now());
        when(sysUserApplicationService.register(any())).thenReturn(dto);

        mockMvc.perform(post("/api/v1/sys/user/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResponseCode.SUCCESS.getCode()))
                .andExpect(jsonPath("$.data.username").value("alice"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("register：无效请求（缺字段）返回 400 + 参数校验错误")
    void register_invalidRequest_shouldReturn400() throws Exception {
        // 空请求体：username/password/email 全为 null，触发 @NotBlank
        String requestJson = "{}";

        mockMvc.perform(post("/api/v1/sys/user/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ResponseCode.PARAM_INVALID.getCode()));
    }

    @Test
    @DisplayName("login：有效请求返回 200")
    void login_validRequest_shouldReturn200() throws Exception {
        LoginRequest request = new LoginRequest("alice", "password123");
        SysUserDTO dto = new SysUserDTO(1L, "alice", "alice@example.com", "alice", 1, Instant.now());
        when(sysUserApplicationService.login(any())).thenReturn(dto);

        mockMvc.perform(post("/api/v1/sys/user/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResponseCode.SUCCESS.getCode()))
                .andExpect(jsonPath("$.data.username").value("alice"));
    }

    @Test
    @DisplayName("profile：GET /api/v1/sys/user/{userId} 返回 200")
    void profile_validUserId_shouldReturn200() throws Exception {
        SysUserDTO dto = new SysUserDTO(1L, "alice", "alice@example.com", "alice", 1, Instant.now());
        when(sysUserApplicationService.getProfile(anyLong())).thenReturn(dto);

        mockMvc.perform(get("/api/v1/sys/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResponseCode.SUCCESS.getCode()))
                .andExpect(jsonPath("$.data.id").value(1));
    }
}

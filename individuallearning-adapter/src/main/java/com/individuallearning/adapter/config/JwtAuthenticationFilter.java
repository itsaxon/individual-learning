package com.individuallearning.adapter.config;

import com.individuallearning.common.api.ApiResponse;
import com.individuallearning.common.api.ResponseCode;
import com.individuallearning.common.exception.BizException;
import com.individuallearning.domain.auth.service.TokenGenerator;
import com.individuallearning.domain.auth.service.TokenGenerator.ParsedToken;
import com.individuallearning.infrastructure.context.UserContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT 认证过滤器：从请求头解析 JWT 令牌，设置 SecurityContext 与 UserContext。
 * <p>
 * 白名单路径不做拦截；令牌缺失/无效返回 401 JSON 响应。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final TokenGenerator tokenGenerator;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            ParsedToken parsed = tokenGenerator.parse(token);
            var authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
            var authentication = new UsernamePasswordAuthenticationToken(parsed.userId(), null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserContext.setUserId(parsed.userId());
            filterChain.doFilter(request, response);
        } catch (BizException | JwtException e) {
            writeUnauthorizedResponse(response, e.getMessage());
        } finally {
            UserContext.clear();
        }
    }

    /** 从 Authorization 头提取 Bearer 令牌 */
    private String extractToken(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (StringUtils.hasText(authorization) && authorization.startsWith("Bearer ")) {
            return authorization.substring(7).trim();
        }
        return null;
    }

    /** 返回 401 JSON 响应 */
    private void writeUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        ApiResponse<Void> result = ApiResponse.fail(ResponseCode.UNAUTHORIZED, message);
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}

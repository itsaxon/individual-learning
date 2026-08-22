package com.individuallearning.application.auth.dto;

/**
 * 令牌视图数据
 *
 * @param accessToken  访问令牌
 * @param refreshToken 刷新令牌
 * @param expiresIn    访问令牌剩余有效时长（秒）
 * @param user         登录用户信息
 */
public record TokenDTO(String accessToken, String refreshToken, Long expiresIn, LoginUserDTO user) {
}

package com.individuallearning.application.guessword.dto;

/**
 * 随机词视图
 *
 * @param token 加密后的目标词 token（前端无法解密）
 */
public record RandomWordDTO(String token) {
}
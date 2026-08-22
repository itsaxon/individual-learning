package com.individuallearning.application.guessword.dto;

/**
 * 每日词视图
 *
 * @param token 加密后的目标词 token（前端无法解密）
 * @param date  日期
 */
public record DailyWordDTO(String token, String date) {
}
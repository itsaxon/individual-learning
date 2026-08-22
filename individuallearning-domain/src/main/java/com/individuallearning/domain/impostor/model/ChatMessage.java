package com.individuallearning.domain.impostor.model;

/**
 * 聊天消息值对象（不可变）
 *
 * @param playerId   发送者 id
 * @param playerName 发送者昵称
 * @param text       消息文本
 * @param timestamp  时间戳（毫秒）
 */
public record ChatMessage(String playerId, String playerName, String text, long timestamp) {
}

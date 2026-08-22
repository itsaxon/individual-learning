package com.individuallearning.application.impostor.dto;

/**
 * 玩家视图（不暴露 role 字段，避免泄露冒牌货身份）
 *
 * @param id         玩家 id
 * @param name       昵称
 * @param online     是否在线
 * @param voted      是否已投票
 * @param eliminated 是否已被淘汰
 */
public record PlayerDTO(String id, String name, boolean online, boolean voted, boolean eliminated) {
}

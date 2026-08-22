package com.individuallearning.application.impostor.dto;

/**
 * 私密角色信息（仅对当前玩家本人下发）。
 * <p>
 * 冒牌货收到 role=IMPOSTOR、word=null；平民收到 role=CIVILIAN、word=秘密词。
 *
 * @param role 角色名（IMPOSTOR / CIVILIAN）
 * @param word 秘密词（冒牌货为 null）
 */
public record RoleDTO(String role, String word) {
}

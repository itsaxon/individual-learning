package com.individuallearning.application.permission.dto;

import java.time.Instant;

/**
 * 权限视图数据
 */
public record PermissionDTO(Long id, String code, String name, Integer type, Long parentId, Integer sort,
                            Integer status, Instant createTime) {
}

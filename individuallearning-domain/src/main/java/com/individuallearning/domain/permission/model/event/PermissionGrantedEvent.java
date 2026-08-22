package com.individuallearning.domain.permission.model.event;

import com.individuallearning.domain.shared.DomainEvent;

/**
 * 权限授予领域事件
 */
public class PermissionGrantedEvent extends DomainEvent {

    private final Long roleId;
    private final Long permissionId;

    public PermissionGrantedEvent(Long roleId, Long permissionId) {
        this.roleId = roleId;
        this.permissionId = permissionId;
    }

    public Long getRoleId() {
        return roleId;
    }

    public Long getPermissionId() {
        return permissionId;
    }
}

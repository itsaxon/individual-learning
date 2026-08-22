package com.individuallearning.domain.permission.model.event;

import com.individuallearning.domain.shared.DomainEvent;

/**
 * 角色创建成功领域事件
 */
public class RoleCreatedEvent extends DomainEvent {

    private final Long roleId;
    private final String roleCode;
    private final String roleName;

    public RoleCreatedEvent(Long roleId, String roleCode, String roleName) {
        this.roleId = roleId;
        this.roleCode = roleCode;
        this.roleName = roleName;
    }

    public Long getRoleId() {
        return roleId;
    }

    public String getRoleCode() {
        return roleCode;
    }

    public String getRoleName() {
        return roleName;
    }
}

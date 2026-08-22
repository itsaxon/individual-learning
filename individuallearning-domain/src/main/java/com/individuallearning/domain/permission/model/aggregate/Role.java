package com.individuallearning.domain.permission.model.aggregate;

import com.individuallearning.common.exception.DomainException;
import com.individuallearning.domain.permission.model.event.PermissionGrantedEvent;
import com.individuallearning.domain.permission.model.event.PermissionRevokedEvent;
import com.individuallearning.domain.permission.model.event.RoleCreatedEvent;
import com.individuallearning.domain.permission.model.valobj.PermissionId;
import com.individuallearning.domain.permission.model.valobj.RoleCode;
import com.individuallearning.domain.permission.model.valobj.RoleId;
import com.individuallearning.domain.permission.model.valobj.RoleStatus;
import com.individuallearning.domain.shared.AggregateRoot;
import lombok.Getter;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * 角色聚合根：封装角色核心业务规则，外部只能通过行为方法改变状态。
 * 不暴露 setter，保证聚合内一致性。
 */
@Getter
public class Role extends AggregateRoot<RoleId> {

    private RoleCode code;
    private String name;
    private String description;
    private RoleStatus status;
    private Set<PermissionId> permissions;
    private Instant createTime;
    private Instant updateTime;

    private Role() {
    }

    /**
     * 创建新角色（领域工厂方法）
     */
    public static Role create(RoleId id, RoleCode code, String name, String description) {
        if (name == null || name.isBlank()) {
            throw new DomainException("角色名称不能为空");
        }
        Role role = new Role();
        role.id = id;
        role.code = code;
        role.name = name;
        role.description = description;
        role.status = RoleStatus.enabled();
        role.permissions = new HashSet<>();
        Instant now = Instant.now();
        role.createTime = now;
        role.updateTime = now;
        role.raiseEvent(new RoleCreatedEvent(id.getValue(), code.getValue(), name));
        return role;
    }

    /**
     * 由持久化数据重建聚合（供 Repository 实现使用）
     */
    public static Role reconstitute(RoleId id, RoleCode code, String name, String description, int status,
                                     Set<PermissionId> permissions, Instant createTime, Instant updateTime) {
        Role role = new Role();
        role.id = id;
        role.code = code;
        role.name = name;
        role.description = description;
        role.status = RoleStatus.of(status);
        role.permissions = permissions == null ? new HashSet<>() : new HashSet<>(permissions);
        role.createTime = createTime;
        role.updateTime = updateTime;
        return role;
    }

    /**
     * 授予权限：若已存在则抛领域异常
     */
    public void grantPermission(PermissionId permissionId) {
        if (permissions.contains(permissionId)) {
            throw new DomainException("该权限已授予");
        }
        permissions.add(permissionId);
        this.updateTime = Instant.now();
        raiseEvent(new PermissionGrantedEvent(id.getValue(), permissionId.getValue()));
    }

    /**
     * 撤销权限：若不存在则抛领域异常
     */
    public void revokePermission(PermissionId permissionId) {
        if (!permissions.contains(permissionId)) {
            throw new DomainException("未授予该权限");
        }
        permissions.remove(permissionId);
        this.updateTime = Instant.now();
        raiseEvent(new PermissionRevokedEvent(id.getValue(), permissionId.getValue()));
    }

    /**
     * 启用
     */
    public void enable() {
        this.status = status.enable();
        this.updateTime = Instant.now();
    }

    /**
     * 禁用
     */
    public void disable() {
        this.status = status.disable();
        this.updateTime = Instant.now();
    }

    /**
     * 更新名称和描述
     */
    public void updateInfo(String name, String description) {
        if (name == null || name.isBlank()) {
            throw new DomainException("角色名称不能为空");
        }
        this.name = name;
        this.description = description;
        this.updateTime = Instant.now();
    }

    /**
     * 是否拥有某权限
     */
    public boolean hasPermission(PermissionId permissionId) {
        return permissions.contains(permissionId);
    }

    /**
     * 对外暴露不可变权限集合
     */
    public Set<PermissionId> getPermissions() {
        return Collections.unmodifiableSet(permissions);
    }
}

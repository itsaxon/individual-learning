package com.individuallearning.domain.permission.model.aggregate;

import com.individuallearning.common.exception.DomainException;
import com.individuallearning.domain.permission.model.valobj.PermissionCode;
import com.individuallearning.domain.permission.model.valobj.PermissionId;
import com.individuallearning.domain.permission.model.valobj.PermissionStatus;
import com.individuallearning.domain.permission.model.valobj.PermissionType;
import com.individuallearning.domain.shared.AggregateRoot;
import lombok.Getter;

import java.time.Instant;

/**
 * 权限聚合根：封装权限核心业务规则，外部只能通过行为方法改变状态。
 * 不暴露 setter，保证聚合内一致性。
 */
@Getter
public class Permission extends AggregateRoot<PermissionId> {

    private PermissionCode code;
    private String name;
    private PermissionType type;
    private Long parentId;
    private int sort;
    private PermissionStatus status;
    private Instant createTime;
    private Instant updateTime;

    private Permission() {
    }

    /**
     * 创建新权限（领域工厂方法）
     */
    public static Permission create(PermissionId id, PermissionCode code, String name, PermissionType type,
                                     Long parentId, int sort) {
        if (name == null || name.isBlank()) {
            throw new DomainException("权限名称不能为空");
        }
        if (type == null) {
            throw new DomainException("权限类型不能为空");
        }
        Permission permission = new Permission();
        permission.id = id;
        permission.code = code;
        permission.name = name;
        permission.type = type;
        permission.parentId = parentId;
        permission.sort = sort;
        permission.status = PermissionStatus.enabled();
        Instant now = Instant.now();
        permission.createTime = now;
        permission.updateTime = now;
        return permission;
    }

    /**
     * 由持久化数据重建聚合（供 Repository 实现使用）
     */
    public static Permission reconstitute(PermissionId id, PermissionCode code, String name, PermissionType type,
                                           Long parentId, int sort, int status, Instant createTime, Instant updateTime) {
        Permission permission = new Permission();
        permission.id = id;
        permission.code = code;
        permission.name = name;
        permission.type = type;
        permission.parentId = parentId;
        permission.sort = sort;
        permission.status = PermissionStatus.of(status);
        permission.createTime = createTime;
        permission.updateTime = updateTime;
        return permission;
    }

    /**
     * 更新信息
     */
    public void updateInfo(String name, Long parentId, int sort) {
        if (name == null || name.isBlank()) {
            throw new DomainException("权限名称不能为空");
        }
        this.name = name;
        this.parentId = parentId;
        this.sort = sort;
        this.updateTime = Instant.now();
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
}

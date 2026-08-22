package com.individuallearning.domain.permission.service;

import com.individuallearning.common.exception.DomainException;
import com.individuallearning.domain.permission.model.aggregate.Permission;
import com.individuallearning.domain.permission.model.aggregate.Role;
import com.individuallearning.domain.permission.model.valobj.PermissionCode;
import com.individuallearning.domain.permission.model.valobj.PermissionId;
import com.individuallearning.domain.permission.model.valobj.PermissionType;
import com.individuallearning.domain.permission.model.valobj.RoleCode;
import com.individuallearning.domain.permission.model.valobj.RoleId;
import com.individuallearning.domain.permission.repository.PermissionRepository;
import com.individuallearning.domain.permission.repository.RoleRepository;
import com.individuallearning.domain.shared.IdGenerator;

/**
 * 权限领域服务：处理角色与权限跨聚合的协作逻辑（如编码唯一性校验、授权）。
 * 纯 POJO，由基础设施层装配为 Spring Bean。
 * 领域服务不承担持久化，保存由应用层统一控制。
 */
public class PermissionDomainService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final IdGenerator idGenerator;

    public PermissionDomainService(RoleRepository roleRepository, PermissionRepository permissionRepository,
                                   IdGenerator idGenerator) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.idGenerator = idGenerator;
    }

    /**
     * 创建角色：校验编码唯一 → 预生成 ID → 委托聚合工厂创建 → 返回（不持久化，由应用层保存）
     */
    public Role createRole(RoleCode code, String name, String description) {
        if (roleRepository.existsByCode(code)) {
            throw new DomainException("角色编码已存在");
        }
        RoleId roleId = new RoleId(idGenerator.nextId());
        Role role = Role.create(roleId, code, name, description);
        return role;
    }

    /**
     * 创建权限：校验编码唯一 → 预生成 ID → 委托聚合工厂创建 → 返回（不持久化，由应用层保存）
     */
    public Permission createPermission(PermissionCode code, String name, PermissionType type, Long parentId, int sort) {
        if (permissionRepository.existsByCode(code)) {
            throw new DomainException("权限编码已存在");
        }
        PermissionId permissionId = new PermissionId(idGenerator.nextId());
        Permission permission = Permission.create(permissionId, code, name, type, parentId, sort);
        return permission;
    }

    /**
     * 授予权限：查找角色 → 确认权限存在 → 委托聚合行为 → 返回 Role（由应用层保存）
     */
    public Role grantPermission(RoleId roleId, PermissionId permissionId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new DomainException("角色不存在"));
        permissionRepository.findById(permissionId)
                .orElseThrow(() -> new DomainException("权限不存在"));
        role.grantPermission(permissionId);
        return role;
    }

    /**
     * 撤销权限：查找角色 → 委托聚合行为 → 返回 Role（由应用层保存）
     */
    public Role revokePermission(RoleId roleId, PermissionId permissionId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new DomainException("角色不存在"));
        role.revokePermission(permissionId);
        return role;
    }
}

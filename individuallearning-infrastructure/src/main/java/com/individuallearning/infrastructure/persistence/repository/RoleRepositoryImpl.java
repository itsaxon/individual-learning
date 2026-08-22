package com.individuallearning.infrastructure.persistence.repository;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.toolkit.Db;
import com.individuallearning.domain.permission.model.aggregate.Role;
import com.individuallearning.domain.permission.model.valobj.PermissionId;
import com.individuallearning.domain.permission.model.valobj.RoleCode;
import com.individuallearning.domain.permission.model.valobj.RoleId;
import com.individuallearning.domain.permission.repository.RoleRepository;
import com.individuallearning.infrastructure.persistence.converter.RoleConverter;
import com.individuallearning.infrastructure.persistence.mapper.RoleMapper;
import com.individuallearning.infrastructure.persistence.mapper.RolePermissionMapper;
import com.individuallearning.infrastructure.persistence.po.RolePO;
import com.individuallearning.infrastructure.persistence.po.RolePermissionPO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 角色仓储实现：领域层 RoleRepository 端口的具体实现，依赖 MyBatis Plus。
 * 维护角色聚合与角色-权限关联表的一致性。
 */
@Repository
@RequiredArgsConstructor
public class RoleRepositoryImpl implements RoleRepository {

    private final RoleMapper roleMapper;
    private final RolePermissionMapper rolePermissionMapper;

    @Override
    public Optional<Role> findById(RoleId id) {
        RolePO po = roleMapper.selectById(id.getValue());
        if (po == null) {
            return Optional.empty();
        }
        Set<Long> permissionIds = findPermissionIdsByRoleId(id.getValue());
        return Optional.of(RoleConverter.toDomain(po, permissionIds));
    }

    @Override
    public Optional<Role> findByCode(RoleCode code) {
        RolePO po = roleMapper.selectOne(Wrappers.<RolePO>lambdaQuery()
                .eq(RolePO::getCode, code.getValue()));
        if (po == null) {
            return Optional.empty();
        }
        Set<Long> permissionIds = findPermissionIdsByRoleId(po.getId());
        return Optional.of(RoleConverter.toDomain(po, permissionIds));
    }

    @Override
    public boolean existsByCode(RoleCode code) {
        return roleMapper.exists(Wrappers.<RolePO>lambdaQuery()
                .eq(RolePO::getCode, code.getValue()));
    }

    @Override
    public void save(Role role) {
        RolePO po = RoleConverter.toPO(role);
        Db.saveOrUpdate(po);
        // 增量更新角色-权限关联：仅删除被移除的、插入新增的
        Set<Long> existingIds = findPermissionIdsByRoleId(po.getId());
        Set<Long> currentIds = (role.getPermissions() == null)
                ? Collections.emptySet()
                : role.getPermissions().stream().map(PermissionId::getValue).collect(Collectors.toSet());
        // 需删除：existing - current
        Set<Long> toDelete = new HashSet<>(existingIds);
        toDelete.removeAll(currentIds);
        if (!toDelete.isEmpty()) {
            rolePermissionMapper.delete(Wrappers.<RolePermissionPO>lambdaQuery()
                    .eq(RolePermissionPO::getRoleId, po.getId())
                    .in(RolePermissionPO::getPermissionId, toDelete));
        }
        // 需新增：current - existing
        Set<Long> toAdd = new HashSet<>(currentIds);
        toAdd.removeAll(existingIds);
        if (!toAdd.isEmpty()) {
            List<RolePermissionPO> toInsert = toAdd.stream().map(pid -> {
                RolePermissionPO rp = new RolePermissionPO();
                rp.setRoleId(po.getId());
                rp.setPermissionId(pid);
                return rp;
            }).collect(Collectors.toList());
            Db.saveBatch(toInsert);
        }
    }

    @Override
    public void remove(RoleId id) {
        rolePermissionMapper.delete(Wrappers.<RolePermissionPO>lambdaQuery()
                .eq(RolePermissionPO::getRoleId, id.getValue()));
        roleMapper.deleteById(id.getValue());
    }

    @Override
    public List<Role> findAll() {
        List<RolePO> pos = roleMapper.selectList(null);
        if (pos.isEmpty()) {
            return Collections.emptyList();
        }
        return pos.stream()
                .map(po -> RoleConverter.toDomain(po, findPermissionIdsByRoleId(po.getId())))
                .collect(Collectors.toList());
    }

    private Set<Long> findPermissionIdsByRoleId(Long roleId) {
        List<RolePermissionPO> rps = rolePermissionMapper.selectList(
                Wrappers.<RolePermissionPO>lambdaQuery().eq(RolePermissionPO::getRoleId, roleId));
        return rps.stream().map(RolePermissionPO::getPermissionId).collect(Collectors.toSet());
    }
}

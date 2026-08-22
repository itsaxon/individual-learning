package com.individuallearning.domain.permission.repository;

import com.individuallearning.domain.permission.model.aggregate.Permission;
import com.individuallearning.domain.permission.model.valobj.PermissionCode;
import com.individuallearning.domain.permission.model.valobj.PermissionId;

import java.util.List;
import java.util.Optional;

/**
 * 权限仓储端口：定义在领域层，仅表达"获取/保存聚合"的语义，不含任何 SQL 细节。
 * 实现由基础设施层提供（MyBatis Plus）。
 */
public interface PermissionRepository {

    /** 按ID查找聚合 */
    Optional<Permission> findById(PermissionId id);

    /** 按编码查找聚合 */
    Optional<Permission> findByCode(PermissionCode code);

    /** 编码是否已存在 */
    boolean existsByCode(PermissionCode code);

    /** 查询所有权限 */
    List<Permission> findAll();

    /** 保存聚合（新增或更新） */
    void save(Permission permission);

    /** 删除聚合 */
    void remove(PermissionId id);
}

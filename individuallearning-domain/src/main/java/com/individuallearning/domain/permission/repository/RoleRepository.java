package com.individuallearning.domain.permission.repository;

import com.individuallearning.domain.permission.model.aggregate.Role;
import com.individuallearning.domain.permission.model.valobj.RoleCode;
import com.individuallearning.domain.permission.model.valobj.RoleId;

import java.util.List;
import java.util.Optional;

/**
 * 角色仓储端口：定义在领域层，仅表达"获取/保存聚合"的语义，不含任何 SQL 细节。
 * 实现由基础设施层提供（MyBatis Plus）。
 */
public interface RoleRepository {

    /** 按ID查找聚合（含权限ID集合） */
    Optional<Role> findById(RoleId id);

    /** 按编码查找聚合（含权限ID集合） */
    Optional<Role> findByCode(RoleCode code);

    /** 编码是否已存在 */
    boolean existsByCode(RoleCode code);

    /** 保存聚合（新增或更新，含关联的权限ID集合） */
    void save(Role role);

    /** 删除聚合（含关联的权限ID集合） */
    void remove(RoleId id);

    /** 查询所有角色 */
    List<Role> findAll();
}

package com.individuallearning.domain.permission.repository;

import com.individuallearning.domain.permission.model.valobj.RoleId;

import java.util.List;

/**
 * 用户角色关联端口：定义在领域层，表达用户与角色之间的分配关系，不含任何 SQL 细节。
 * 实现由基础设施层提供（MyBatis Plus）。
 */
public interface UserRoleRepository {

    /** 分配角色给用户 */
    void assign(Long userId, RoleId roleId);

    /** 撤销用户的角色 */
    void revoke(Long userId, RoleId roleId);

    /** 查询用户的所有角色ID */
    List<RoleId> findRoleIdsByUserId(Long userId);

    /** 查询角色下的所有用户ID */
    List<Long> findUserIdsByRoleId(RoleId roleId);

    /** 是否已分配 */
    boolean exists(Long userId, RoleId roleId);
}

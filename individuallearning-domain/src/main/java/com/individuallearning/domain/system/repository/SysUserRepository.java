package com.individuallearning.domain.system.repository;

import com.individuallearning.domain.system.model.aggregate.SysUser;
import com.individuallearning.domain.system.model.valobj.UserId;
import com.individuallearning.domain.system.model.valobj.Username;

import java.util.Optional;

/**
 * 用户聚合仓储端口：定义在领域层，仅表达“获取/保存聚合”的语义，不含任何 SQL 细节。
 * 实现由基础设施层提供（MyBatis Plus）。
 */
public interface SysUserRepository {

    /** 按ID查找聚合 */
    Optional<SysUser> findById(UserId id);

    /** 按用户名查找聚合 */
    Optional<SysUser> findByUsername(Username username);

    /** 用户名是否已存在 */
    boolean existsByUsername(Username username);

    /** 保存聚合（新增或更新） */
    void save(SysUser user);

    /** 删除聚合 */
    void remove(UserId id);
}

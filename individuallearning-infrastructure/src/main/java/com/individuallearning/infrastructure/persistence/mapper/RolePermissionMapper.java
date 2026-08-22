package com.individuallearning.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.individuallearning.infrastructure.persistence.po.RolePermissionPO;
import org.apache.ibatis.annotations.Mapper;

/**
 * 角色-权限关联 Mapper：MyBatis Plus 自动提供单表 CRUD，仅在基础设施层可见。
 */
@Mapper
public interface RolePermissionMapper extends BaseMapper<RolePermissionPO> {
}

package com.individuallearning.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.individuallearning.infrastructure.persistence.po.AuthSessionPO;
import org.apache.ibatis.annotations.Mapper;

/**
 * 认证会话 Mapper：MyBatis Plus 自动提供单表 CRUD，仅在基础设施层可见。
 */
@Mapper
public interface AuthSessionMapper extends BaseMapper<AuthSessionPO> {
}

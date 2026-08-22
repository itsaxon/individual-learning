package com.individuallearning.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.individuallearning.infrastructure.persistence.entity.GameCallLogPO;
import org.apache.ibatis.annotations.Mapper;

/**
 * 游戏调用日志 Mapper：MyBatis Plus 自动提供单表 CRUD。
 */
@Mapper
public interface GameCallLogMapper extends BaseMapper<GameCallLogPO> {
}

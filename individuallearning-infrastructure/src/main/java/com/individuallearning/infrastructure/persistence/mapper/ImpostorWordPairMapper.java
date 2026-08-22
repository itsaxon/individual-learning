package com.individuallearning.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.individuallearning.infrastructure.persistence.po.ImpostorWordPairPO;
import org.apache.ibatis.annotations.Mapper;

/**
 * 冒牌货词对 Mapper：MyBatis Plus 自动提供单表 CRUD。
 */
@Mapper
public interface ImpostorWordPairMapper extends BaseMapper<ImpostorWordPairPO> {
}

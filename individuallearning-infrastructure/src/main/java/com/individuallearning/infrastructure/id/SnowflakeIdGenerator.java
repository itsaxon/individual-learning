package com.individuallearning.infrastructure.id;

import cn.hutool.core.lang.Snowflake;
import cn.hutool.core.util.IdUtil;
import com.individuallearning.domain.shared.IdGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * ID 生成器实现：雪花算法，保证全局唯一、趋势递增。
 * workerId / dataCenterId 通过配置指定，多实例部署时需保证唯一。
 */
@Component
public class SnowflakeIdGenerator implements IdGenerator {

    private final Snowflake snowflake;

    public SnowflakeIdGenerator(
            @Value("${frame.snowflake.worker-id:1}") long workerId,
            @Value("${frame.snowflake.datacenter-id:1}") long dataCenterId) {
        this.snowflake = IdUtil.getSnowflake(workerId, dataCenterId);
    }

    @Override
    public long nextId() {
        return snowflake.nextId();
    }
}

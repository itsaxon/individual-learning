package com.individuallearning.infrastructure.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.individuallearning.infrastructure.context.UserContext;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * MyBatis Plus 自动填充：新增/更新时写入时间与审计字段。
 */
@Component
public class IndividuallearningMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        Instant now = Instant.now();
        this.strictInsertFill(metaObject, "createTime", Instant.class, now);
        this.strictInsertFill(metaObject, "updateTime", Instant.class, now);
        this.strictInsertFill(metaObject, "creator", Long.class, UserContext.getUserId());
        this.strictInsertFill(metaObject, "updater", Long.class, UserContext.getUserId());
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updateTime", Instant.class, Instant.now());
        this.strictUpdateFill(metaObject, "updater", Long.class, UserContext.getUserId());
    }
}

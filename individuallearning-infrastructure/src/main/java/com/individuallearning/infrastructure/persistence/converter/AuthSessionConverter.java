package com.individuallearning.infrastructure.persistence.converter;

import com.individuallearning.domain.auth.model.aggregate.AuthSession;
import com.individuallearning.domain.auth.model.valobj.SessionId;
import com.individuallearning.domain.auth.model.valobj.SessionStatus;
import com.individuallearning.domain.system.model.valobj.UserId;
import com.individuallearning.infrastructure.persistence.po.AuthSessionPO;

import java.time.Instant;

/**
 * 认证会话 PO 与领域聚合互转：隔离持久化结构与领域模型。
 */
public class AuthSessionConverter {

    private AuthSessionConverter() {
    }

    /** 聚合 -> PO（create/update 时间由 MetaObjectHandler 维护，不在此映射） */
    public static AuthSessionPO toPO(AuthSession session) {
        if (session == null) {
            return null;
        }
        AuthSessionPO po = new AuthSessionPO();
        po.setId(session.getId().getValue());
        po.setUserId(session.getUserId().getValue());
        po.setAccessToken(session.getAccessToken());
        po.setRefreshToken(session.getRefreshToken());
        po.setStatus(session.getStatus().getCode());
        po.setLoginIp(session.getLoginIp());
        po.setLoginTime(session.getLoginTime());
        po.setExpireTime(session.getExpireTime());
        po.setRefreshExpireTime(session.getRefreshExpireTime());
        return po;
    }

    /** PO -> 聚合（重建） */
    public static AuthSession toDomain(AuthSessionPO po) {
        if (po == null) {
            return null;
        }
        return AuthSession.reconstitute(
                new SessionId(po.getId()),
                new UserId(po.getUserId()),
                po.getAccessToken(),
                po.getRefreshToken(),
                SessionStatus.of(po.getStatus()),
                po.getLoginIp(),
                po.getLoginTime(),
                po.getExpireTime(),
                po.getRefreshExpireTime(),
                po.getCreateTime(),
                po.getUpdateTime()
        );
    }
}

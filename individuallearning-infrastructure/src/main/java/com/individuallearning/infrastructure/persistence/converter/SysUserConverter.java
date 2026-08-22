package com.individuallearning.infrastructure.persistence.converter;

import com.individuallearning.infrastructure.persistence.po.SysUserPO;
import com.individuallearning.domain.system.model.aggregate.SysUser;
import com.individuallearning.domain.system.model.valobj.Email;
import com.individuallearning.domain.system.model.valobj.Password;
import com.individuallearning.domain.system.model.valobj.UserId;
import com.individuallearning.domain.system.model.valobj.Username;
import com.individuallearning.domain.system.model.valobj.UserStatus;

import java.time.Instant;

/**
 * 用户 PO 与领域聚合互转：隔离持久化结构与领域模型。
 */
public class SysUserConverter {

    private SysUserConverter() {
    }

    /** 聚合 -> PO（时间字段由 MetaObjectHandler 维护，不在此映射） */
    public static SysUserPO toPO(SysUser user) {
        if (user == null) {
            return null;
        }
        SysUserPO po = new SysUserPO();
        po.setId(user.getId().getValue());
        po.setUsername(user.getUsername().getValue());
        po.setPassword(user.getPassword().getEncodedValue());
        po.setEmail(user.getEmail().getValue());
        po.setNickname(user.getNickname());
        po.setStatus(user.getStatus().getCode());
        return po;
    }

    /** PO -> 聚合（重建） */
    public static SysUser toDomain(SysUserPO po) {
        if (po == null) {
            return null;
        }
        return SysUser.reconstitute(
                new UserId(po.getId()),
                new Username(po.getUsername()),
                Password.ofEncoded(po.getPassword()),
                new Email(po.getEmail()),
                po.getNickname(),
                UserStatus.of(po.getStatus()),
                po.getCreateTime(),
                po.getUpdateTime()
        );
    }
}

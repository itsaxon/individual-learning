package com.individuallearning.application.system.assembler;

import com.individuallearning.application.system.dto.SysUserDTO;
import com.individuallearning.domain.system.model.aggregate.SysUser;

/**
 * 用户应用层装配器：聚合 <-> DTO 转换，隔离领域模型与对外视图。
 */
public class SysUserAssembler {

    private SysUserAssembler() {
    }

    public static SysUserDTO toDTO(SysUser user) {
        if (user == null) {
            return null;
        }
        return new SysUserDTO(
                user.getId().getValue(),
                user.getUsername().getValue(),
                user.getEmail().getValue(),
                user.getNickname(),
                user.getStatus().getCode(),
                user.getCreateTime()
        );
    }
}

package com.individuallearning.domain.permission.model.valobj;

import com.individuallearning.domain.shared.Identifier;

import java.io.Serializable;

/**
 * 角色标识值对象
 */
public class RoleId extends Identifier<Long> implements Serializable {

    public RoleId(Long value) {
        super(value);
    }
}

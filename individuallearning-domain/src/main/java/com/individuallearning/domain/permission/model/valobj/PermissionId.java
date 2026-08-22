package com.individuallearning.domain.permission.model.valobj;

import com.individuallearning.domain.shared.Identifier;

import java.io.Serializable;

/**
 * 权限标识值对象
 */
public class PermissionId extends Identifier<Long> implements Serializable {

    public PermissionId(Long value) {
        super(value);
    }
}

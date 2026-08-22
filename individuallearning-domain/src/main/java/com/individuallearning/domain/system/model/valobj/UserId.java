package com.individuallearning.domain.system.model.valobj;

import com.individuallearning.domain.shared.Identifier;

import java.io.Serializable;

/**
 * 用户标识值对象
 */
public class UserId extends Identifier<Long> implements Serializable {

    public UserId(Long value) {
        super(value);
    }
}

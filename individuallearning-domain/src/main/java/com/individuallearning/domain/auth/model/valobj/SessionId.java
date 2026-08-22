package com.individuallearning.domain.auth.model.valobj;

import com.individuallearning.domain.shared.Identifier;

import java.io.Serializable;

/**
 * 会话标识值对象
 */
public class SessionId extends Identifier<Long> implements Serializable {

    public SessionId(Long value) {
        super(value);
    }
}

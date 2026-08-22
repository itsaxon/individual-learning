package com.individuallearning.domain.system.model.event;

import com.individuallearning.domain.shared.DomainEvent;

/**
 * 用户密码修改领域事件
 */
public class UserPasswordChangedEvent extends DomainEvent {

    private final Long userId;

    public UserPasswordChangedEvent(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return userId;
    }
}

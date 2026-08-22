package com.individuallearning.domain.auth.model.event;

import com.individuallearning.domain.shared.DomainEvent;

/**
 * 用户登出领域事件
 */
public class UserLoggedOutEvent extends DomainEvent {

    private final Long userId;
    private final Long sessionId;

    public UserLoggedOutEvent(Long userId, Long sessionId) {
        this.userId = userId;
        this.sessionId = sessionId;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getSessionId() {
        return sessionId;
    }
}

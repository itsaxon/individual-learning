package com.individuallearning.domain.auth.model.event;

import com.individuallearning.domain.shared.DomainEvent;

/**
 * 令牌刷新领域事件
 */
public class TokenRefreshedEvent extends DomainEvent {

    private final Long userId;
    private final Long sessionId;

    public TokenRefreshedEvent(Long userId, Long sessionId) {
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

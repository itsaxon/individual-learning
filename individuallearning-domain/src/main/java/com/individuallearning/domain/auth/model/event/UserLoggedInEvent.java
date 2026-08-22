package com.individuallearning.domain.auth.model.event;

import com.individuallearning.domain.shared.DomainEvent;

/**
 * 用户登录成功领域事件
 */
public class UserLoggedInEvent extends DomainEvent {

    private final Long userId;
    private final Long sessionId;
    private final String loginIp;

    public UserLoggedInEvent(Long userId, Long sessionId, String loginIp) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.loginIp = loginIp;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public String getLoginIp() {
        return loginIp;
    }
}

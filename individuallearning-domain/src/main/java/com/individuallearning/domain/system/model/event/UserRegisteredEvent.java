package com.individuallearning.domain.system.model.event;

import com.individuallearning.domain.shared.DomainEvent;

/**
 * 用户注册成功领域事件
 */
public class UserRegisteredEvent extends DomainEvent {

    private final Long userId;
    private final String username;
    private final String email;

    public UserRegisteredEvent(Long userId, String username, String email) {
        this.userId = userId;
        this.username = username;
        this.email = email;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }
}

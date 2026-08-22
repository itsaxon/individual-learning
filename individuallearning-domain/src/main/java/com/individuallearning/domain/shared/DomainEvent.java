package com.individuallearning.domain.shared;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * 领域事件基类：领域中发生的重要业务事实，解耦后续副作用处理。
 */
public abstract class DomainEvent implements Serializable {

    private final String eventId;
    private final Instant occurredOn;

    protected DomainEvent() {
        this.eventId = UUID.randomUUID().toString();
        this.occurredOn = Instant.now();
    }

    public String getEventId() {
        return eventId;
    }

    public Instant getOccurredOn() {
        return occurredOn;
    }
}

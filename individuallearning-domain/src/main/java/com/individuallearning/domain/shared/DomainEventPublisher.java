package com.individuallearning.domain.shared;

import java.util.List;

/**
 * 领域事件发布器端口：定义在领域层，由基础设施层实现。
 */
public interface DomainEventPublisher {

    /**
     * 发布一组领域事件
     */
    void publish(List<DomainEvent> events);

    /**
     * 发布单个领域事件
     */
    default void publish(DomainEvent event) {
        publish(List.of(event));
    }
}

package com.individuallearning.infrastructure.event;

import com.individuallearning.domain.shared.DomainEvent;
import com.individuallearning.domain.shared.DomainEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 领域事件发布器实现：借助 Spring 事件机制广播，监听器可异步处理。
 */
@Component
@RequiredArgsConstructor
public class SpringDomainEventPublisher implements DomainEventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;

    @Override
    public void publish(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            applicationEventPublisher.publishEvent(event);
        }
    }
}

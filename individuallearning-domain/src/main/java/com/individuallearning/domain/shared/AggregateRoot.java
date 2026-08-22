package com.individuallearning.domain.shared;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 聚合根基类：维护聚合内一致性，并收集待发布的领域事件。
 */
public abstract class AggregateRoot<I extends Identifier<?>> extends BaseEntity<I> {

    /**
     * 领域事件集合（transient：不参与持久化）。
     * 反序列化时不调用构造器，final 字段无法重新初始化会导致 NPE，
     * 因此移除 final，通过 {@link #events()} 延迟初始化。
     */
    private transient List<DomainEvent> domainEvents;

    private List<DomainEvent> events() {
        if (domainEvents == null) {
            domainEvents = new ArrayList<>();
        }
        return domainEvents;
    }

    /** 抛出一个领域事件 */
    protected void raiseEvent(DomainEvent event) {
        if (event != null) {
            events().add(event);
        }
    }

    /** 查看当前事件（不清除） */
    public List<DomainEvent> domainEvents() {
        return Collections.unmodifiableList(events());
    }

    /** 取出并清除事件，交由应用层发布 */
    public List<DomainEvent> pullEvents() {
        List<DomainEvent> snapshot = new ArrayList<>(events());
        events().clear();
        return snapshot;
    }
}

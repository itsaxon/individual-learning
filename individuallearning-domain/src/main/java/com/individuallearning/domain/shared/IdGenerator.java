package com.individuallearning.domain.shared;

/**
 * ID 生成器端口：领域层定义，基础设施层实现（如雪花算法）。
 * 采用预生成 ID，避免“插入后取主键”，便于分库分表与领域事件携带 ID。
 */
public interface IdGenerator {

    /**
     * 生成下一个全局唯一 ID
     */
    long nextId();
}

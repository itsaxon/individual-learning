package com.individuallearning.domain.guessword.model.valobj;

import java.io.Serializable;
import java.util.Objects;

/**
 * 相似度值对象：0-100 量纲，封装相似度计算的语义常量与判定逻辑。
 * <p>
 * 语义约定：
 * <ul>
 *   <li>{@link #NOT_READY}（-1.0）：词库未就绪</li>
 *   <li>{@link #IDENTICAL}（100.0）：两词完全相同</li>
 *   <li>{@link #NOT_IN_CORPUS}（0.0）：任一词不在词库</li>
 * </ul>
 *
 * @author liushuozhen
 * @version v1.0 2026/07/11
 */
public final class Similarity implements Serializable {

    /** 词库未就绪 */
    public static final double NOT_READY = -1.0;
    /** 两词完全相同 */
    public static final double IDENTICAL = 100.0;
    /** 任一词不在词库 */
    public static final double NOT_IN_CORPUS = 0.0;

    private final double value;

    public Similarity(double value) {
        this.value = value;
    }

    public double getValue() {
        return value;
    }

    /** 是否词库未就绪 */
    public boolean isNotReady() {
        return Double.compare(value, NOT_READY) == 0;
    }

    /** 是否完全相同 */
    public boolean isIdentical() {
        return value >= IDENTICAL;
    }

    /** 是否任一词不在词库 */
    public boolean isNotInCorpus() {
        return Double.compare(value, NOT_IN_CORPUS) == 0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Similarity that)) return false;
        return Double.compare(value, that.value) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return "Similarity{value=" + value + "}";
    }
}

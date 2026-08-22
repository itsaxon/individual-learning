package com.individuallearning.domain.guessword.model.valobj;

import java.io.Serializable;
import java.util.Arrays;
import java.util.Objects;

/**
 * 词向量值对象：封装词语及其量化向量（short[]，使用时需除以 1000.0 还原为 double）。
 * <p>
 * 量化策略来自腾讯 AI Lab 词向量文件：float * 1000 取整，并限制在 short 范围内以节省内存。
 * 不可变，按 word 进行相等性比较。
 *
 * @author liushuozhen
 * @version v1.0 2026/07/11
 */
public final class WordVector implements Serializable {

    /** 量化系数：float * 1000 取整 */
    public static final double QUANTIZATION_FACTOR = 1000.0;

    private final String word;
    private final short[] quantizedVector;

    public WordVector(String word, short[] quantizedVector) {
        if (word == null || word.isBlank()) {
            throw new IllegalArgumentException("词语不能为空");
        }
        if (quantizedVector == null || quantizedVector.length == 0) {
            throw new IllegalArgumentException("词向量不能为空");
        }
        this.word = word;
        this.quantizedVector = quantizedVector.clone();
    }

    public String getWord() {
        return word;
    }

    public short[] getQuantizedVector() {
        return quantizedVector.clone();
    }

    /**
     * 计算与另一个词向量的余弦相似度（0-100 量纲，保留两位小数）。
     * <p>
     * 向量存储为 short（量化值），计算时除以 {@link #QUANTIZATION_FACTOR} 还原为 double 保证精度。
     *
     * @param other 另一个词向量，需维度相同
     * @return 0-100 的相似度值；若任一范数为 0 返回 0.0
     */
    public double cosineSimilarityTo(WordVector other) {
        if (other == null || this.quantizedVector.length != other.quantizedVector.length) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < quantizedVector.length; i++) {
            double a = quantizedVector[i] / QUANTIZATION_FACTOR;
            double b = other.quantizedVector[i] / QUANTIZATION_FACTOR;
            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        }

        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }

        double cosine = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        double similarity = cosine * 100.0;
        return Math.round(similarity * 100.0) / 100.0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof WordVector that)) return false;
        return Objects.equals(word, that.word) && Arrays.equals(quantizedVector, that.quantizedVector);
    }

    @Override
    public int hashCode() {
        int result = Objects.hash(word);
        result = 31 * result + Arrays.hashCode(quantizedVector);
        return result;
    }

    @Override
    public String toString() {
        return "WordVector{word='" + word + "', dim=" + quantizedVector.length + "}";
    }
}

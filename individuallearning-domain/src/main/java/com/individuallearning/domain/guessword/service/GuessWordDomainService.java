package com.individuallearning.domain.guessword.service;

import com.individuallearning.domain.guessword.model.valobj.Similarity;
import com.individuallearning.domain.guessword.model.valobj.WordVector;
import com.individuallearning.domain.guessword.repository.WordVectorRepository;

import java.util.Objects;

/**
 * 猜词游戏领域服务：承载相似度计算、选词等核心领域规则。
 * <p>
 * 纯 POJO，由基础设施层装配为 Spring Bean。不承担词库加载与持久化，
 * 词向量数据通过 {@link WordVectorRepository} 端口获取。
 *
 * @author liushuozhen
 * @version v1.0 2026/07/11
 */
public class GuessWordDomainService {

    private final WordVectorRepository wordVectorRepository;

    public GuessWordDomainService(WordVectorRepository wordVectorRepository) {
        this.wordVectorRepository = wordVectorRepository;
    }

    /**
     * 计算猜测词与目标词的相似度。
     * <p>
     * 规则：
     * <ul>
     *   <li>词向量未就绪，返回 {@link Similarity#NOT_READY}</li>
     *   <li>两词相同返回 {@link Similarity#IDENTICAL}</li>
     *   <li>任一词不在词库，返回 {@link Similarity#NOT_IN_CORPUS}</li>
     *   <li>计算余弦相似度 * 100，保留两位小数</li>
     * </ul>
     *
     * @param guess  猜测词
     * @param target 目标词
     * @return 相似度值对象
     */
    public Similarity computeSimilarity(String guess, String target) {
        // 词向量未就绪
        if (!wordVectorRepository.isReady()) {
            return new Similarity(Similarity.NOT_READY);
        }

        // 两词相同直接满分
        if (Objects.equals(guess, target)) {
            return new Similarity(Similarity.IDENTICAL);
        }

        // 任一词不在词库
        if (!wordVectorRepository.contains(guess) || !wordVectorRepository.contains(target)) {
            return new Similarity(Similarity.NOT_IN_CORPUS);
        }

        WordVector vecA = wordVectorRepository.getVector(guess);
        WordVector vecB = wordVectorRepository.getVector(target);
        if (vecA == null || vecB == null) {
            return new Similarity(Similarity.NOT_IN_CORPUS);
        }

        return new Similarity(vecA.cosineSimilarityTo(vecB));
    }

    /**
     * 根据日期获取每日词（同一天所有用户得到同一个词）。
     *
     * @param date 日期字符串，如 "2026-07-11"；为空则取当天
     * @return 每日词
     */
    public String getDailyWord(String date) {
        return wordVectorRepository.getDailyWord(date);
    }

    /**
     * 从常见词中随机选取一个词。
     *
     * @return 随机词
     */
    public String getRandomWord() {
        return wordVectorRepository.getRandomWord();
    }
}

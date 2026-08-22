package com.individuallearning.domain.guessword.repository;

import com.individuallearning.domain.guessword.model.valobj.CorpusLoadStatus;
import com.individuallearning.domain.guessword.model.valobj.WordVector;

/**
 * 词向量仓储端口：定义在领域层，仅表达"查询词向量 / 选词 / 状态"的语义，不含任何文件 I/O 细节。
 * <p>
 * 实现由基础设施层提供（异步加载腾讯 AI Lab 词向量文件）。
 *
 * @author liushuozhen
 * @version v1.0 2026/07/11
 */
public interface WordVectorRepository {

    /** 词库是否就绪可用 */
    boolean isReady();

    /** 词库是否包含指定词 */
    boolean contains(String word);

    /** 获取指定词的词向量，不存在或未就绪返回 null */
    WordVector getVector(String word);

    /** 已加载的词向量数量 */
    int size();

    /** 从常见词中随机选取一个词，词库为空返回 null */
    String getRandomWord();

    /**
     * 根据日期选取每日词（同一天所有用户得到同一个词）。
     *
     * @param date 日期字符串，如 "2026-07-11"
     * @return 每日词，词库为空返回 null
     */
    String getDailyWord(String date);

    /** 当前加载状态 */
    CorpusLoadStatus getLoadStatus();
}

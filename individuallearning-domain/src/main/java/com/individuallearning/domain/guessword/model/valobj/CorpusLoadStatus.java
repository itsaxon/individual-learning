package com.individuallearning.domain.guessword.model.valobj;

/**
 * 词向量词库加载状态
 *
 * @author liushuozhen
 * @version v1.0 2026/07/11
 */
public enum CorpusLoadStatus {
    /** 初始空闲 */
    IDLE,
    /** 加载中 */
    LOADING,
    /** 就绪 */
    READY,
    /** 加载出错 */
    ERROR,
    /** 未启用 / 未配置 / 文件不存在 */
    DISABLED
}

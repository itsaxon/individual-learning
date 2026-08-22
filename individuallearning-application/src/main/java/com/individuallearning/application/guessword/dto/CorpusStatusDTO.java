package com.individuallearning.application.guessword.dto;

/**
 * 词库状态视图
 *
 * @param state      状态：IDLE / LOADING / READY / ERROR / DISABLED
 * @param vectorSize 已加载的词向量数量
 */
public record CorpusStatusDTO(String state, int vectorSize) {
}

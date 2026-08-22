package com.individuallearning.application.guessword.dto;

/**
 * 相似度计算结果视图
 *
 * @param similarity 0-100 的相似度值，-1 表示词库未就绪
 * @param inCorpus   两词是否都在词库中
 * @param message    提示信息
 * @param answer     命中时（similarity>=99）返回明文答案，否则为 null
 */
public record SimilarityDTO(double similarity, boolean inCorpus, String message, String answer) {
}
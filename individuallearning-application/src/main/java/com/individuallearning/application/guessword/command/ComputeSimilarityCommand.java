package com.individuallearning.application.guessword.command;

/**
 * 相似度计算命令
 *
 * @param guess 猜测词
 * @param token 加密后的目标词 token
 */
public record ComputeSimilarityCommand(String guess, String token) {
}
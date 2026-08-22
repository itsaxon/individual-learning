package com.individuallearning.adapter.web.request;

import com.individuallearning.application.guessword.command.ComputeSimilarityCommand;
import jakarta.validation.constraints.NotBlank;

/**
 * 相似度计算请求
 *
 * @param guess  猜测词
 * @param token  加密后的目标词 token（前端无法解密）
 */
public record SimilarityRequest(
        @NotBlank(message = "猜测词不能为空") String guess,
        @NotBlank(message = "token 不能为空") String token) {

    public ComputeSimilarityCommand toCommand() {
        return new ComputeSimilarityCommand(guess, token);
    }
}
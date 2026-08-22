package com.individuallearning.adapter.web.controller;

import com.individuallearning.adapter.web.request.DailyWordRequest;
import com.individuallearning.adapter.web.request.EncryptWordRequest;
import com.individuallearning.adapter.web.request.SimilarityRequest;
import com.individuallearning.application.guessword.command.GetDailyWordCommand;
import com.individuallearning.application.guessword.dto.CorpusStatusDTO;
import com.individuallearning.application.guessword.dto.DailyWordDTO;
import com.individuallearning.application.guessword.dto.RandomWordDTO;
import com.individuallearning.application.guessword.dto.SimilarityDTO;
import com.individuallearning.application.guessword.service.GuessWordApplicationService;
import com.individuallearning.common.api.ApiResponse;
import com.individuallearning.common.util.IpUtils;
import com.individuallearning.infrastructure.persistence.service.GameCallLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 猜词游戏接口
 */
@Tag(name = "猜词游戏", description = "相似度计算、每日词、随机词、词库状态、自定义出题")
@RestController
@RequestMapping("/api/v1/guessword")
@RequiredArgsConstructor
public class GuessWordController {

    private static final String GAME = "guessword";
    private static final String GAME_NAME = "词海寻踪";

    private final GuessWordApplicationService guessWordApplicationService;
    private final GameCallLogService gameCallLogService;

    @Operation(summary = "计算相似度")
    @PostMapping("/similarity")
    public ApiResponse<SimilarityDTO> similarity(@RequestBody @Valid SimilarityRequest request,
                                                 HttpServletRequest httpRequest) {
        long start = System.currentTimeMillis();
        boolean success = true;
        String errorMsg = null;
        try {
            return ApiResponse.success(guessWordApplicationService.computeSimilarity(request.toCommand()));
        } catch (Exception e) {
            success = false;
            errorMsg = e.getMessage();
            throw e;
        } finally {
            gameCallLogService.asyncLog(
                    GAME, GAME_NAME, "similarity",
                    IpUtils.getClientIp(httpRequest),
                    httpRequest.getRequestURI(),
                    httpRequest.getMethod(),
                    truncate(request == null ? null : request.toString()),
                    System.currentTimeMillis() - start,
                    success, errorMsg,
                    IpUtils.getUserAgent(httpRequest)
            );
        }
    }

    @Operation(summary = "获取每日词")
    @PostMapping("/daily")
    public ApiResponse<DailyWordDTO> daily(@RequestBody(required = false) DailyWordRequest request,
                                           HttpServletRequest httpRequest) {
        long start = System.currentTimeMillis();
        boolean success = true;
        String errorMsg = null;
        try {
            GetDailyWordCommand command = (request == null)
                    ? new GetDailyWordCommand(null)
                    : request.toCommand();
            return ApiResponse.success(guessWordApplicationService.getDailyWord(command));
        } catch (Exception e) {
            success = false;
            errorMsg = e.getMessage();
            throw e;
        } finally {
            gameCallLogService.asyncLog(
                    GAME, GAME_NAME, "daily_word",
                    IpUtils.getClientIp(httpRequest),
                    httpRequest.getRequestURI(),
                    httpRequest.getMethod(),
                    truncate(request == null ? null : request.toString()),
                    System.currentTimeMillis() - start,
                    success, errorMsg,
                    IpUtils.getUserAgent(httpRequest)
            );
        }
    }

    @Operation(summary = "随机选词")
    @PostMapping("/random")
    public ApiResponse<RandomWordDTO> random(HttpServletRequest httpRequest) {
        long start = System.currentTimeMillis();
        boolean success = true;
        String errorMsg = null;
        try {
            return ApiResponse.success(guessWordApplicationService.getRandomWord());
        } catch (Exception e) {
            success = false;
            errorMsg = e.getMessage();
            throw e;
        } finally {
            gameCallLogService.asyncLog(
                    GAME, GAME_NAME, "random_word",
                    IpUtils.getClientIp(httpRequest),
                    httpRequest.getRequestURI(),
                    httpRequest.getMethod(),
                    null,
                    System.currentTimeMillis() - start,
                    success, errorMsg,
                    IpUtils.getUserAgent(httpRequest)
            );
        }
    }

    @Operation(summary = "词库状态")
    @GetMapping("/status")
    public ApiResponse<CorpusStatusDTO> status(HttpServletRequest httpRequest) {
        long start = System.currentTimeMillis();
        boolean success = true;
        String errorMsg = null;
        try {
            return ApiResponse.success(guessWordApplicationService.getStatus());
        } catch (Exception e) {
            success = false;
            errorMsg = e.getMessage();
            throw e;
        } finally {
            gameCallLogService.asyncLog(
                    GAME, GAME_NAME, "corpus_status",
                    IpUtils.getClientIp(httpRequest),
                    httpRequest.getRequestURI(),
                    httpRequest.getMethod(),
                    null,
                    System.currentTimeMillis() - start,
                    success, errorMsg,
                    IpUtils.getUserAgent(httpRequest)
            );
        }
    }

    /**
     * 自定义出题：接收明文 word，返回加密 token。
     * 出题方调用此接口获取 token，答题方只持有 token 无法解密。
     */
    @Operation(summary = "自定义出题加密")
    @PostMapping("/encrypt")
    public ApiResponse<Map<String, String>> encrypt(@RequestBody @Valid EncryptWordRequest request,
                                                    HttpServletRequest httpRequest) {
        long start = System.currentTimeMillis();
        boolean success = true;
        String errorMsg = null;
        try {
            String token = guessWordApplicationService.encryptWord(request.word());
            return ApiResponse.success(Map.of("token", token));
        } catch (Exception e) {
            success = false;
            errorMsg = e.getMessage();
            throw e;
        } finally {
            gameCallLogService.asyncLog(
                    GAME, GAME_NAME, "encrypt_word",
                    IpUtils.getClientIp(httpRequest),
                    httpRequest.getRequestURI(),
                    httpRequest.getMethod(),
                    truncate(request == null ? null : request.toString()),
                    System.currentTimeMillis() - start,
                    success, errorMsg,
                    IpUtils.getUserAgent(httpRequest)
            );
        }
    }

    /** 截断参数字符串到 1000 字符，避免日志表 params 字段过大。 */
    private String truncate(String s) {
        if (s == null) {
            return null;
        }
        return s.length() > 1000 ? s.substring(0, 1000) : s;
    }
}

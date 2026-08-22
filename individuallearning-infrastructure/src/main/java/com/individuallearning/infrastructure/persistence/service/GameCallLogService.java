package com.individuallearning.infrastructure.persistence.service;

/**
 * 游戏调用日志服务：异步记录"什么 IP 玩了什么游戏"。
 * <p>
 * 失败时仅打 warn 日志，不阻塞主流程。
 */
public interface GameCallLogService {

    /**
     * 异步记录一次游戏调用日志。
     *
     * @param game       游戏标识（如 impostor / guessword）
     * @param gameName   游戏中文名（如 找出冒牌货 / 词海寻踪）
     * @param operation  操作类型（如 create_room / similarity）
     * @param clientIp   客户端真实 IP
     * @param path       请求路径
     * @param method     HTTP 方法（GET/POST）
     * @param params     请求参数 JSON
     * @param durationMs 耗时毫秒
     * @param success    是否成功
     * @param errorMsg   错误信息（如有）
     * @param userAgent  客户端 UA
     */
    void asyncLog(String game, String gameName, String operation,
                  String clientIp, String path, String method,
                  String params, Long durationMs, boolean success,
                  String errorMsg, String userAgent);
}

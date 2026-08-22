package com.individuallearning.adapter.web.request;

import com.individuallearning.application.guessword.command.GetDailyWordCommand;

/**
 * 每日词请求
 *
 * @param date 日期，如 2026-07-11，可选，默认今天
 */
public record DailyWordRequest(String date) {

    /**
     * 转换为获取每日词命令
     */
    public GetDailyWordCommand toCommand() {
        return new GetDailyWordCommand(date);
    }
}

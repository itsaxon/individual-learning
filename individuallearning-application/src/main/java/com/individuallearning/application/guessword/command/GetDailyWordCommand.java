package com.individuallearning.application.guessword.command;

/**
 * 获取每日词命令
 *
 * @param date 日期字符串，如 "2026-07-11"；为空则取当天
 */
public record GetDailyWordCommand(String date) {
}

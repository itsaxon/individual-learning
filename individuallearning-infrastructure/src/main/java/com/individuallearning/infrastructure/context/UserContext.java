package com.individuallearning.infrastructure.context;

/**
 * 用户上下文：基于 ThreadLocal 存储当前操作人 ID，供审计字段填充使用。
 * 在鉴权拦截器中设置，在请求结束时清理。
 */
public final class UserContext {

    private static final ThreadLocal<Long> CURRENT_USER_ID = new ThreadLocal<>();

    private UserContext() {
    }

    /** 设置当前用户 ID */
    public static void setUserId(Long userId) {
        CURRENT_USER_ID.set(userId);
    }

    /** 获取当前用户 ID（未登录时返回 0） */
    public static Long getUserId() {
        Long id = CURRENT_USER_ID.get();
        return id == null ? 0L : id;
    }

    /** 清理当前线程的用户上下文 */
    public static void clear() {
        CURRENT_USER_ID.remove();
    }
}

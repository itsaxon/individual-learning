package com.individuallearning.common.constant;

/**
 * 公共常量
 */
public final class CommonConstant {

    private CommonConstant() {
    }

    /** 逻辑删除-未删除 */
    public static final int NOT_DELETED = 0;
    /** 逻辑删除-已删除 */
    public static final int DELETED = 1;

    /** 默认页码 */
    public static final long DEFAULT_PAGE_NUM = 1L;
    /** 默认每页大小 */
    public static final long DEFAULT_PAGE_SIZE = 10L;

    /** 缓存 key 前缀 */
    public static final String CACHE_PREFIX = "frame:";

    /** 系统租户ID */
    public static final String DEFAULT_TENANT_ID = "000000";
}

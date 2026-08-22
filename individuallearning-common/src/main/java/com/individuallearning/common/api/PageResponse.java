package com.individuallearning.common.api;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * 分页响应结构
 */
@Data
public class PageResponse<T> implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 当前页 */
    private long pageNum;
    /** 每页大小 */
    private long pageSize;
    /** 总条数 */
    private long total;
    /** 总页数 */
    private long pages;
    /** 数据集合 */
    private List<T> data = Collections.emptyList();

    public static <T> PageResponse<T> of(long pageNum, long pageSize, long total, List<T> data) {
        PageResponse<T> response = new PageResponse<T>();
        response.setPageNum(pageNum);
        response.setPageSize(pageSize);
        response.setTotal(total);
        response.setPages(pageSize == 0 ? 0 : (total + pageSize - 1) / pageSize);
        response.setData(data == null ? Collections.emptyList() : data);
        return response;
    }
}

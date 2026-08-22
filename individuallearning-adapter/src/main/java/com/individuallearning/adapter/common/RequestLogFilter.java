package com.individuallearning.adapter.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;

/**
 * 请求日志过滤器：记录请求方法、路径、耗时、状态码。
 * <p>
 * 使用 ContentCachingRequestWrapper/ResponseWrapper 包装以读取请求体和响应体，
 * 注意仅在日志级别为 DEBUG 时才记录请求体。
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RequestLogFilter extends OncePerRequestFilter {

    private static final int MAX_LOG_BODY_LENGTH = 500;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();
        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            logRequest(wrappedRequest, wrappedResponse, duration);
            wrappedResponse.copyBodyToResponse();
        }
    }

    private void logRequest(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response,
                            long duration) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        int status = response.getStatus();
        String queryString = request.getQueryString();
        String fullUri = queryString == null ? uri : uri + "?" + queryString;

        if (log.isDebugEnabled()) {
            String requestBody = truncate(new String(request.getContentAsByteArray()));
            log.debug("[{}] {} {} | status={} | duration={}ms | body={}",
                    mdcTraceId(), method, fullUri, status, duration, requestBody);
        } else {
            log.info("[{}] {} {} | status={} | duration={}ms",
                    mdcTraceId(), method, fullUri, status, duration);
        }
    }

    private String truncate(String str) {
        if (str == null || str.length() <= MAX_LOG_BODY_LENGTH) {
            return str;
        }
        return str.substring(0, MAX_LOG_BODY_LENGTH) + "...(truncated)";
    }

    private String mdcTraceId() {
        return org.slf4j.MDC.get(TraceIdFilter.TRACE_ID);
    }
}

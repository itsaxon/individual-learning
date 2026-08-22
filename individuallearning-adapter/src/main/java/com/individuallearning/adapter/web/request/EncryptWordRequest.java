package com.individuallearning.adapter.web.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 自定义出题请求：前端出题方提交明文 word，后端返回加密 token
 */
public record EncryptWordRequest(
        @NotBlank(message = "目标词不能为空")
        @Size(max = 10, message = "目标词最多 10 个字") String word) {
}
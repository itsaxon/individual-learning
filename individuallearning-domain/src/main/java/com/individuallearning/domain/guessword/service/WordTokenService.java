package com.individuallearning.domain.guessword.service;

/**
 * 猜词目标词加密端口：领域层定义，基础设施层提供 AES 等实现。
 * <p>
 * 密钥仅在 后端 保存，前端只持有密文 token，无法解密获取明文目标词。
 *
 * @author liushuozhen
 * @version v1.0 2026/07/18
 */
public interface WordTokenService {

    /**
     * 加密目标词 → token。
     *
     * @param word 明文目标词
     * @return URL-safe Base64 编码的 token
     */
    String encrypt(String word);

    /**
     * 解密 token → 明文目标词。
     *
     * @param token URL-safe Base64 编码的 token
     * @return 明文目标词
     */
    String decrypt(String token);
}

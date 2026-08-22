package com.individuallearning.infrastructure.security;

import com.individuallearning.common.exception.BizException;
import com.individuallearning.domain.guessword.service.WordTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * 猜词目标词加密服务实现：AES-CBC 对称加密。
 * <p>
 * 密钥仅在 后端 保存，前端只持有密文 token，无法解密获取明文目标词。
 * 加密格式：IV(16B) + 密文，整体 URL-safe Base64 编码（无 padding）。
 *
 * @author liushuozhen
 * @version v1.0 2026/07/18
 */
@Component
public class AesWordTokenService implements WordTokenService {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/CBC/PKCS5Padding";
    private static final int IV_LENGTH = 16;

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public AesWordTokenService(@Value("${frame.guessword.token-secret}") String secret) {
        if (secret == null || secret.length() < 16) {
            throw new IllegalStateException("frame.guessword.token-secret 至少需要 16 个字符");
        }
        // 从 secret 派生 AES-128 密钥：SHA-256 → 前 16 字节
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(secret.getBytes(StandardCharsets.UTF_8));
            this.secretKey = new SecretKeySpec(Arrays.copyOf(digest, 16), ALGORITHM);
        } catch (Exception e) {
            throw new IllegalStateException("初始化 AES 密钥失败", e);
        }
    }

    @Override
    public String encrypt(String word) {
        if (word == null || word.isBlank()) {
            throw new BizException("目标词不能为空");
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new IvParameterSpec(iv));
            byte[] encrypted = cipher.doFinal(word.getBytes(StandardCharsets.UTF_8));
            // 拼接 IV + 密文
            byte[] combined = new byte[IV_LENGTH + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, IV_LENGTH);
            System.arraycopy(encrypted, 0, combined, IV_LENGTH, encrypted.length);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(combined);
        } catch (Exception e) {
            throw new BizException("目标词加密失败");
        }
    }

    @Override
    public String decrypt(String token) {
        if (token == null || token.isBlank()) {
            throw new BizException("token 不能为空");
        }
        try {
            byte[] combined = Base64.getUrlDecoder().decode(token);
            if (combined.length < IV_LENGTH) {
                throw new BizException("token 格式无效");
            }
            byte[] iv = Arrays.copyOf(combined, IV_LENGTH);
            byte[] encrypted = Arrays.copyOfRange(combined, IV_LENGTH, combined.length);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new IvParameterSpec(iv));
            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            throw new BizException("token 解密失败");
        }
    }
}

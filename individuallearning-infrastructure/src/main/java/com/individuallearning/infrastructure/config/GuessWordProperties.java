package com.individuallearning.infrastructure.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 猜词游戏词向量配置。
 *
 * @author liushuozhen
 * @version v1.0 2026/07/11
 */
@Data
@Component
@ConfigurationProperties(prefix = "guessword.vector")
public class GuessWordProperties {

    /**
     * 是否启用腾讯词向量（下载文件后改为 true）
     */
    private boolean enabled = false;

    /**
     * 词向量文件路径，如 D:/data/Tencent_AILab_ChineseEmbedding.txt
     */
    private String path = "";

    /**
     * 最大加载词数（控制内存）
     */
    private int maxWords = 2000000;

    /**
     * 向量维度
     */
    private int dimension = 200;
}

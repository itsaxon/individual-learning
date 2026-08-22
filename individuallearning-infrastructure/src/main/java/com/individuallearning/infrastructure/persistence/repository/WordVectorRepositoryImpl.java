package com.individuallearning.infrastructure.persistence.repository;

import com.individuallearning.domain.guessword.model.valobj.CorpusLoadStatus;
import com.individuallearning.domain.guessword.model.valobj.WordVector;
import com.individuallearning.domain.guessword.repository.WordVectorRepository;
import com.individuallearning.infrastructure.config.GuessWordProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.CompletableFuture;

/**
 * 词向量仓储实现：领域层 {@link WordVectorRepository} 端口的具体实现。
 * <p>
 * 异步加载腾讯 AI Lab 词向量文件，使用 short[] 量化存储（float * 1000 取整）以节省内存。
 * 文件格式：第一行 {@code 词数 维度}，后续每行 {@code 词 v1 v2 ... vN}。
 *
 * @author liushuozhen
 * @version v1.0 2026/07/11
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class WordVectorRepositoryImpl implements WordVectorRepository {

    /**
     * 常见词收录上限（前 50000 个 2-4 字的中文词，用于随机选词）
     */
    private static final int COMMON_WORDS_LIMIT = 50000;

    /**
     * 每日词收录上限（前 5000 个 2 字中文词，词向量文件按词频排序，越靠前越常见）
     */
    private static final int DAILY_WORDS_LIMIT = 5000;

    /**
     * 每日词固定列表：50 个日常生活中最常见的物品（2 字中文词）。
     * 不依赖词库文件加载，即使词库未就绪也能返回每日词。
     * 这些词都是常见词，确保在腾讯词向量中存在，similarity 计算可正常进行。
     */
    private static final List<String> DAILY_ITEMS = List.of(
            "桌子", "椅子", "杯子", "筷子", "勺子",
            "盘子", "铁锅", "铲子", "菜刀", "叉子",
            "镜子", "梳子", "牙刷", "毛巾", "肥皂",
            "香水", "衣服", "裤子", "鞋子", "袜子",
            "帽子", "围巾", "手套", "背包", "钱包",
            "手表", "眼镜", "雨伞", "钥匙", "手机",
            "电脑", "鼠标", "键盘", "屏幕", "台灯",
            "闹钟", "书本", "钢笔", "纸张", "本子",
            "床铺", "枕头", "被子", "柜子", "沙发",
            "电视", "冰箱", "空调", "风扇", "花瓶"
    );

    private final GuessWordProperties guessWordProperties;

    /**
     * 加载状态
     */
    private volatile CorpusLoadStatus loadStatus = CorpusLoadStatus.IDLE;

    /**
     * 词到向量的映射（量化后的 short 数组）
     */
    private volatile Map<String, short[]> wordVectorMap = Collections.emptyMap();

    /**
     * 常见词列表（前 50000 个 2-4 字的中文词，用于随机选词）
     */
    private volatile List<String> commonWords = Collections.emptyList();

    /**
     * 每日词列表（前 5000 个 2 字中文词，确保每日词都是 2 字且常见）
     */
    private volatile List<String> dailyWords = Collections.emptyList();

    private final Random random = new Random();

    /**
     * 应用启动后异步加载词向量，不阻塞应用启动
     */
    @PostConstruct
    public void init() {
        // 未启用或未配置路径，直接禁用
        if (!guessWordProperties.isEnabled()) {
            loadStatus = CorpusLoadStatus.DISABLED;
            log.info("猜词词向量未启用，状态置为 DISABLED");
            return;
        }

        String path = guessWordProperties.getPath();
        if (path == null || path.isBlank()) {
            loadStatus = CorpusLoadStatus.DISABLED;
            log.warn("猜词词向量路径未配置，状态置为 DISABLED");
            return;
        }

        File file = new File(path);
        if (!file.exists() || !file.isFile()) {
            loadStatus = CorpusLoadStatus.DISABLED;
            log.warn("猜词词向量文件不存在: {}，状态置为 DISABLED", path);
            return;
        }

        // 异步加载，不阻塞应用启动
        loadStatus = CorpusLoadStatus.LOADING;
        CompletableFuture.runAsync(() -> loadVectorFile(file));
    }

    /**
     * 加载词向量文件
     */
    private void loadVectorFile(File file) {
        log.info("开始加载词向量文件: {}", file.getAbsolutePath());
        long startTime = System.currentTimeMillis();
        int maxWords = guessWordProperties.getMaxWords();

        Map<String, short[]> localMap = new HashMap<>(Math.min(maxWords, 1 << 20));
        List<String> localCommonWords = new ArrayList<>(COMMON_WORDS_LIMIT);
        List<String> localDailyWords = new ArrayList<>(DAILY_WORDS_LIMIT);

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8))) {

            // 第一行：词数 维度
            String header = reader.readLine();
            if (header == null || header.isBlank()) {
                throw new IllegalStateException("词向量文件为空或首行格式错误");
            }
            String[] headerParts = header.trim().split("\\s+");
            int dimension = Integer.parseInt(headerParts[1]);
            log.info("词向量文件声明: 词数={}, 维度={}", headerParts[0], dimension);

            String line;
            int count = 0;
            while (count < maxWords && (line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                String[] parts = line.split("\\s+");
                if (parts.length < dimension + 1) {
                    continue;
                }

                String word = parts[0];
                short[] vector = new short[dimension];
                for (int i = 0; i < dimension; i++) {
                    float val = Float.parseFloat(parts[i + 1]);
                    // float * 1000 取整量化，并限制在 short 范围内
                    int quantized = Math.round(val * 1000);
                    if (quantized > Short.MAX_VALUE) {
                        quantized = Short.MAX_VALUE;
                    } else if (quantized < Short.MIN_VALUE) {
                        quantized = Short.MIN_VALUE;
                    }
                    vector[i] = (short) quantized;
                }
                localMap.put(word, vector);

                // 收录 2-4 字的常见中文词（前 50000 个，用于随机选词）
                if (localCommonWords.size() < COMMON_WORDS_LIMIT && isChineseWord(word, 2, 4)) {
                    localCommonWords.add(word);
                }

                // 收录 2 字中文词（前 5000 个，词频排序靠前，确保常见且为 2 字）
                if (localDailyWords.size() < DAILY_WORDS_LIMIT && isChineseWord(word, 2, 2)) {
                    localDailyWords.add(word);
                }

                count++;
                // 每 10 万词打印一次加载进度
                if (count % 100000 == 0) {
                    log.info("词向量加载进度: 已加载 {} 词", count);
                }
            }

            // 发布结果（volatile 写保证可见性）
            this.wordVectorMap = localMap;
            this.commonWords = Collections.unmodifiableList(localCommonWords);
            this.dailyWords = Collections.unmodifiableList(localDailyWords);
            this.loadStatus = CorpusLoadStatus.READY;

            long cost = System.currentTimeMillis() - startTime;
            log.info("词向量加载完成: 共 {} 词，常见词 {} 个，每日词 {} 个，耗时 {} ms",
                    count, localCommonWords.size(), localDailyWords.size(), cost);

        } catch (Exception e) {
            this.loadStatus = CorpusLoadStatus.ERROR;
            log.error("词向量加载失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 判断是否为指定长度的中文词（仅包含 CJK 汉字，过滤英文、数字、特殊字符）
     */
    private boolean isChineseWord(String word, int minLen, int maxLen) {
        int len = word.length();
        if (len < minLen || len > maxLen) {
            return false;
        }
        for (int i = 0; i < len; i++) {
            char c = word.charAt(i);
            if (c < '\u4e00' || c > '\u9fff') {
                return false;
            }
        }
        return true;
    }

    @Override
    public boolean isReady() {
        return loadStatus == CorpusLoadStatus.READY;
    }

    @Override
    public boolean contains(String word) {
        return loadStatus == CorpusLoadStatus.READY && word != null && wordVectorMap.containsKey(word);
    }

    @Override
    public WordVector getVector(String word) {
        if (loadStatus != CorpusLoadStatus.READY || word == null) {
            return null;
        }
        short[] vector = wordVectorMap.get(word);
        return vector == null ? null : new WordVector(word, vector);
    }

    @Override
    public int size() {
        return wordVectorMap.size();
    }

    @Override
    public String getRandomWord() {
        if (commonWords.isEmpty()) {
            return null;
        }
        return commonWords.get(random.nextInt(commonWords.size()));
    }

    @Override
    public String getDailyWord(String date) {
        // 从硬编码的 50 个日常生活常见物品中选词，不依赖词库加载状态
        // 用日期 hashCode 取模，确保同一天结果一致
        int idx = Math.floorMod(date.hashCode(), DAILY_ITEMS.size());
        return DAILY_ITEMS.get(idx);
    }

    @Override
    public CorpusLoadStatus getLoadStatus() {
        return loadStatus;
    }
}

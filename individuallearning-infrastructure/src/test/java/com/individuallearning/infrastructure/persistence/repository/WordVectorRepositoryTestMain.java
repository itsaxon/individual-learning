package com.individuallearning.infrastructure.persistence.repository;

import com.individuallearning.infrastructure.config.GuessWordProperties;

import java.lang.reflect.Field;
import java.util.List;

/**
 * 临时测试类：验证 WordVectorRepositoryImpl 的 dailyWords 只收录 2 字中文词。
 * 不依赖 Spring 容器 / JUnit，直接运行 main 方法。
 *
 * 运行方式：
 *   cd individual-learning
 *   mvn -pl individuallearning-infrastructure -am compile
 *   mvn -pl individuallearning-infrastructure exec:java \
 *     -Dexec.mainClass=com.individuallearning.infrastructure.persistence.repository.WordVectorRepositoryTestMain
 */
public class WordVectorRepositoryTestMain {

    public static void main(String[] args) throws Exception {
        // 1. 构造 properties，指向测试词向量文件
        GuessWordProperties props = new GuessWordProperties();
        props.setEnabled(true);
        props.setPath(WordVectorRepositoryTestMain.class
                .getClassLoader().getResource("test-vectors.txt").getPath());
        props.setMaxWords(100);
        props.setDimension(4);

        // 2. 构造 repository（@RequiredArgsConstructor 生成构造函数）
        WordVectorRepositoryImpl repo = new WordVectorRepositoryImpl(props);

        // 3. 调用 init()（异步加载，需要等待）
        repo.init();

        // 4. 等待加载完成（最多 5 秒）
        int waited = 0;
        while (!repo.isReady() && waited < 5000) {
            Thread.sleep(100);
            waited += 100;
        }

        if (!repo.isReady()) {
            System.err.println("✗ 词库加载失败或超时");
            System.exit(1);
        }

        System.out.println("=== 词库加载完成，词数: " + repo.size() + " ===\n");

        // 5. 用反射获取 dailyWords 和 commonWords
        Field dailyWordsField = WordVectorRepositoryImpl.class.getDeclaredField("dailyWords");
        dailyWordsField.setAccessible(true);
        @SuppressWarnings("unchecked")
        List<String> dailyWords = (List<String>) dailyWordsField.get(repo);

        Field commonWordsField = WordVectorRepositoryImpl.class.getDeclaredField("commonWords");
        commonWordsField.setAccessible(true);
        @SuppressWarnings("unchecked")
        List<String> commonWords = (List<String>) commonWordsField.get(repo);

        // 6. 验证 dailyWords 只含 2 字中文词
        System.out.println("dailyWords (" + dailyWords.size() + " 个): " + dailyWords);
        boolean dailyAllTwoChar = dailyWords.stream().allMatch(w -> w.length() == 2);
        boolean dailyAllChinese = dailyWords.stream()
                .allMatch(w -> w.chars().allMatch(c -> c >= 0x4e00 && c <= 0x9fff));
        System.out.println("  全部 2 字: " + (dailyAllTwoChar ? "✓ 是" : "✗ 否"));
        System.out.println("  全部中文: " + (dailyAllChinese ? "✓ 是" : "✗ 否"));

        // 7. 验证 commonWords 含 2-4 字中文词
        System.out.println("\ncommonWords (" + commonWords.size() + " 个): " + commonWords);
        boolean commonValid = commonWords.stream().allMatch(w -> w.length() >= 2 && w.length() <= 4);
        System.out.println("  全部 2-4 字: " + (commonValid ? "✓ 是" : "✗ 否"));

        // 8. 验证 getDailyWord 返回 2 字词
        System.out.println("\n=== 测试 getDailyWord ===");
        int pass = 0, fail = 0;
        for (int i = 1; i <= 30; i++) {
            String date = "2026-07-" + String.format("%02d", i);
            String word = repo.getDailyWord(date);
            boolean ok = word != null && word.length() == 2;
            System.out.println("  " + date + " → \"" + word + "\" (" + (word == null ? 0 : word.length()) + "字) " + (ok ? "✓" : "✗"));
            if (ok) pass++; else fail++;
        }
        System.out.println("\n结果: " + pass + " 通过, " + fail + " 失败");

        // 9. 验证同一天返回相同结果（一致性）
        String w1 = repo.getDailyWord("2026-07-18");
        String w2 = repo.getDailyWord("2026-07-18");
        System.out.println("一致性: " + (w1.equals(w2) ? "✓ 同一天结果一致" : "✗ 不一致"));

        // 10. 验证 getRandomWord
        System.out.println("\n=== 测试 getRandomWord（5 次）===");
        for (int i = 0; i < 5; i++) {
            String w = repo.getRandomWord();
            System.out.println("  [" + (i + 1) + "] \"" + w + "\" (" + w.length() + "字)");
        }

        if (dailyAllTwoChar && dailyAllChinese && fail == 0) {
            System.out.println("\n✓✓✓ 全部测试通过！每日词均为 2 字中文词。");
        } else {
            System.out.println("\n✗✗✗ 测试失败！");
            System.exit(1);
        }
    }
}

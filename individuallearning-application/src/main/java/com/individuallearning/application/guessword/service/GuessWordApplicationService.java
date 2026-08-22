package com.individuallearning.application.guessword.service;

import com.individuallearning.application.guessword.assembler.GuessWordAssembler;
import com.individuallearning.application.guessword.command.ComputeSimilarityCommand;
import com.individuallearning.application.guessword.command.GetDailyWordCommand;
import com.individuallearning.application.guessword.dto.CorpusStatusDTO;
import com.individuallearning.application.guessword.dto.DailyWordDTO;
import com.individuallearning.application.guessword.dto.RandomWordDTO;
import com.individuallearning.application.guessword.dto.SimilarityDTO;
import com.individuallearning.domain.guessword.model.valobj.Similarity;
import com.individuallearning.domain.guessword.repository.WordVectorRepository;
import com.individuallearning.domain.guessword.service.GuessWordDomainService;
import com.individuallearning.domain.guessword.service.WordTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * 猜词游戏应用服务：用 token（AES 加密）替代明文 target。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GuessWordApplicationService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final GuessWordDomainService guessWordDomainService;
    private final WordVectorRepository wordVectorRepository;
    private final WordTokenService wordTokenService;

    /**
     * 计算相似度：前端传 token，后端解密获取 target。
     * 命中时（similarity>=99）返回明文 answer。
     */
    public SimilarityDTO computeSimilarity(ComputeSimilarityCommand command) {
        if (!wordVectorRepository.isReady()) {
            return GuessWordAssembler.toSimilarityDTO(new Similarity(Similarity.NOT_READY), false, null);
        }

        // 解密 token 获取明文 target
        String target = wordTokenService.decrypt(command.token());

        log.info("target:{}",target);

        boolean inCorpus = wordVectorRepository.contains(command.guess())
                && wordVectorRepository.contains(target);

        Similarity similarity = guessWordDomainService.computeSimilarity(command.guess(), target);
        return GuessWordAssembler.toSimilarityDTO(similarity, inCorpus, target);
    }

    /**
     * 获取每日词：返回 token（不返回明文 word）。
     */
    public DailyWordDTO getDailyWord(GetDailyWordCommand command) {
        String date = (command == null || command.date() == null || command.date().isBlank())
                ? LocalDate.now().format(DATE_FORMATTER)
                : command.date();

        String word = guessWordDomainService.getDailyWord(date);
        log.info("daily word:{}",word);
        String token = wordTokenService.encrypt(word);
        return GuessWordAssembler.toDailyWordDTO(token, date);
    }

    /**
     * 随机选词：返回 token。
     */
    public RandomWordDTO getRandomWord() {
        String word = guessWordDomainService.getRandomWord();
        String token = wordTokenService.encrypt(word);
        return GuessWordAssembler.toRandomWordDTO(token);
    }

    /**
     * 自定义出题：接收明文 word，返回加密 token。
     * 出题方知道 word，无泄漏问题；答题方只拿到 token。
     */
    public String encryptWord(String word) {
        return wordTokenService.encrypt(word);
    }

    /**
     * 查询词库加载状态。
     */
    public CorpusStatusDTO getStatus() {
        return GuessWordAssembler.toCorpusStatusDTO(
                wordVectorRepository.getLoadStatus(),
                wordVectorRepository.size());
    }
}
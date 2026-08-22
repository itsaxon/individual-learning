package com.individuallearning.application.guessword.assembler;

import com.individuallearning.application.guessword.dto.CorpusStatusDTO;
import com.individuallearning.application.guessword.dto.DailyWordDTO;
import com.individuallearning.application.guessword.dto.RandomWordDTO;
import com.individuallearning.application.guessword.dto.SimilarityDTO;
import com.individuallearning.domain.guessword.model.valobj.CorpusLoadStatus;
import com.individuallearning.domain.guessword.model.valobj.Similarity;

/**
 * 猜词应用层装配器：领域对象 ↔ DTO 转换。
 */
public class GuessWordAssembler {

    private GuessWordAssembler() {
    }

    /**
     * 装配相似度视图。命中时返回明文答案。
     *
     * @param similarity 相似度值对象
     * @param inCorpus   两词是否都在词库中
     * @param target     明文目标词（命中时作为 answer 返回）
     */
    public static SimilarityDTO toSimilarityDTO(Similarity similarity, boolean inCorpus, String target) {
        if (similarity == null) {
            return new SimilarityDTO(Similarity.NOT_READY, false, "词库加载中", null);
        }

        String message;
        if (similarity.isNotReady()) {
            message = "词库加载中";
        } else if (!inCorpus) {
            message = "词语不在词库中";
        } else if (similarity.isIdentical()) {
            message = "完全相同";
        } else {
            message = "相似度计算完成";
        }

        // 命中时返回明文答案
        String answer = similarity.isIdentical() ? target : null;
        return new SimilarityDTO(similarity.getValue(), inCorpus, message, answer);
    }

    public static DailyWordDTO toDailyWordDTO(String token, String date) {
        return new DailyWordDTO(token, date);
    }

    public static RandomWordDTO toRandomWordDTO(String token) {
        return new RandomWordDTO(token);
    }

    public static CorpusStatusDTO toCorpusStatusDTO(CorpusLoadStatus loadStatus, int vectorSize) {
        return new CorpusStatusDTO(loadStatus.name(), vectorSize);
    }
}
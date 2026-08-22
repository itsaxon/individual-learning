package com.individuallearning.domain.impostor.model.valobj;

/**
 * 词对值对象：一对近似词，开局时随机分配给平民与冒牌货。
 * <p>
 * wordA 与 wordB 语义接近但不相同；由领域服务随机决定哪个词给平民（秘密词）、
 * 哪个给冒牌货（近似词），避免冒牌货通过记忆词对推断出平民词。
 *
 * @param wordA 近似词 A
 * @param wordB 近似词 B
 */
public record WordPair(String wordA, String wordB) {
}

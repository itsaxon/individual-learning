package com.individuallearning.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 冒牌货词对持久化对象：与 impostor_word_pair 表一一对应。
 * <p>
 * 每行存储一对近似词 word_a / word_b，开局时由领域服务随机分配给平民与冒牌货。
 */
@Data
@TableName("impostor_word_pair")
public class ImpostorWordPairPO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 主键（领域层预生成的雪花 ID） */
    @TableId(type = IdType.INPUT)
    private Long id;

    /** 近似词 A */
    private String wordA;

    /** 近似词 B */
    private String wordB;

    /** 分类（食物/地点/交通/器物/...） */
    private String category;

    /** 逻辑删除标记 */
    @TableLogic
    private Integer deleted;
}

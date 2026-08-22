package com.individuallearning.domain.impostor.repository;

import com.individuallearning.domain.impostor.model.Room;
import com.individuallearning.domain.impostor.model.valobj.WordPair;

import java.util.List;

/**
 * 找出冒牌货仓储端口：负责房间聚合的持久化与词对加载。
 * <p>
 * 由基础设施层提供具体实现（内存或外部存储）。
 */
public interface ImpostorRepository {

    /**
     * 保存房间
     */
    Room save(Room room);

    /**
     * 根据房间 id 查询
     */
    Room findById(String roomId);

    /**
     * 删除房间
     */
    void delete(String roomId);

    /**
     * 加载词对列表（每对为两个近似词，开局时随机分配给平民/冒牌货）
     */
    List<WordPair> loadWordPairs();
}

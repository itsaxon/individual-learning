package com.individuallearning.infrastructure.persistence.repository;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.individuallearning.domain.impostor.model.Room;
import com.individuallearning.domain.impostor.model.valobj.WordPair;
import com.individuallearning.domain.impostor.repository.ImpostorRepository;
import com.individuallearning.infrastructure.persistence.mapper.ImpostorWordPairMapper;
import com.individuallearning.infrastructure.persistence.po.ImpostorWordPairPO;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 找出冒牌货仓储实现：内存存储房间状态，启动时从数据库加载词对。
 * <p>
 * 房间使用 {@link ConcurrentHashMap} 存储；词对在 {@link PostConstruct} 阶段一次性从
 * {@code impostor_word_pair} 表加载到内存，运行时零 DB 查询，保证高性能。
 * 若 DB 为空则回退到内置兜底词对。
 */
@Repository
@Slf4j
@RequiredArgsConstructor
public class ImpostorRepositoryImpl implements ImpostorRepository {

    /** 房间存储：roomId → Room */
    private final Map<String, Room> roomStore = new ConcurrentHashMap<>();

    /** 词对缓存（启动时从 DB 加载） */
    private volatile List<WordPair> wordPairs = new ArrayList<>();

    private final ImpostorWordPairMapper wordPairMapper;

    @PostConstruct
    public void init() {
        loadWordPairsFromDb();
    }

    private void loadWordPairsFromDb() {
        try {
            List<ImpostorWordPairPO> rows = wordPairMapper.selectList(
                    Wrappers.<ImpostorWordPairPO>lambdaQuery().select(
                            ImpostorWordPairPO::getWordA,
                            ImpostorWordPairPO::getWordB
                    )
            );
            List<WordPair> pairs = rows.stream()
                    .map(po -> new WordPair(po.getWordA(), po.getWordB()))
                    .toList();
            if (pairs.isEmpty()) {
                log.warn("数据库词对表为空，使用内置兜底词对");
                this.wordPairs = fallbackPairs();
            } else {
                this.wordPairs = pairs;
            }
            log.info("加载冒牌货词对完成，词对数：{}", wordPairs.size());
        } catch (Exception e) {
            log.error("从数据库加载词对失败，使用内置兜底词对：{}", e.getMessage(), e);
            this.wordPairs = fallbackPairs();
        }
    }

    /** 兜底词对：DB 不可用时保证游戏可玩 */
    private List<WordPair> fallbackPairs() {
        return List.of(
                new WordPair("苹果", "梨子"),
                new WordPair("键盘", "鼠标"),
                new WordPair("灯塔", "灯柱"),
                new WordPair("咖啡", "奶茶"),
                new WordPair("地铁", "轻轨")
        );
    }

    @Override
    public Room save(Room room) {
        if (room == null) {
            return null;
        }
        roomStore.put(room.getRoomId(), room);
        return room;
    }

    @Override
    public Room findById(String roomId) {
        if (roomId == null) {
            return null;
        }
        return roomStore.get(roomId);
    }

    @Override
    public void delete(String roomId) {
        if (roomId != null) {
            roomStore.remove(roomId);
        }
    }

    @Override
    public List<WordPair> loadWordPairs() {
        if (wordPairs.isEmpty()) {
            loadWordPairsFromDb();
        }
        return new ArrayList<>(wordPairs);
    }
}

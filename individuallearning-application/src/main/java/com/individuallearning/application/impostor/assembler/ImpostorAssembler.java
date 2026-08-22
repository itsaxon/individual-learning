package com.individuallearning.application.impostor.assembler;

import com.individuallearning.application.impostor.dto.GameStateDTO;
import com.individuallearning.application.impostor.dto.PlayerDTO;
import com.individuallearning.application.impostor.dto.RoomDTO;
import com.individuallearning.domain.impostor.model.Player;
import com.individuallearning.domain.impostor.model.Room;
import com.individuallearning.domain.impostor.model.valobj.GamePhase;

import java.util.List;

/**
 * 找出冒牌货应用层装配器：领域对象 ↔ DTO 转换。
 * <p>
 * 注意：PlayerDTO 不暴露 role 字段，避免泄露冒牌货身份。
 */
public class ImpostorAssembler {

    /** 讨论阶段时长（秒）— 5 分钟 */
    public static final int DISCUSS_SECONDS = 300;
    /** 投票阶段时长（秒）— 1 分钟 */
    public static final int VOTE_SECONDS = 60;

    private ImpostorAssembler() {
    }

    /**
     * 玩家 → PlayerDTO（不暴露 role 字段）
     */
    public static PlayerDTO toPlayerDTO(Player p) {
        if (p == null) {
            return null;
        }
        return new PlayerDTO(p.getId(), p.getName(), p.isOnline(), p.isVoted(), p.isEliminated());
    }

    /**
     * 玩家列表 → PlayerDTO 列表
     */
    public static List<PlayerDTO> toPlayerDTOList(List<Player> players) {
        if (players == null) {
            return List.of();
        }
        return players.stream()
                .map(ImpostorAssembler::toPlayerDTO)
                .toList();
    }

    /**
     * 房间 → RoomDTO
     */
    public static RoomDTO toRoomDTO(Room r) {
        if (r == null) {
            return null;
        }
        return new RoomDTO(
                r.getRoomId(),
                r.getHostId(),
                toPlayerDTOList(r.getPlayers()),
                r.getPhase().name(),
                r.getPlayers().size(),
                r.isReady()
        );
    }

    /**
     * 房间 → GameStateDTO（全量状态但不含秘密词/角色）
     */
    public static GameStateDTO toGameStateDTO(Room r) {
        if (r == null) {
            return null;
        }
        Long deadline = r.getPhaseDeadlineMs() > 0 ? r.getPhaseDeadlineMs() : null;
        Long speakerDeadline = r.getSpeakerDeadlineMs() > 0 ? r.getSpeakerDeadlineMs() : null;
        String currentSpeakerId = r.getPhase() == GamePhase.DISCUSSING ? r.getCurrentSpeakerId() : null;
        List<String> speakerOrder = r.getSpeakerOrder();
        return new GameStateDTO(
                r.getPhase().name(),
                toPlayerDTOList(r.getPlayers()),
                deadline,
                r.getVotes(),
                r.getHostId(),
                DISCUSS_SECONDS,
                VOTE_SECONDS,
                currentSpeakerId,
                speakerDeadline,
                speakerOrder
        );
    }
}

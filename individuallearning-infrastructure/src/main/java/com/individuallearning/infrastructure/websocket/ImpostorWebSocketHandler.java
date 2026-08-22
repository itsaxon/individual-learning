package com.individuallearning.infrastructure.websocket;

import com.individuallearning.application.impostor.dto.GameStateDTO;
import com.individuallearning.application.impostor.dto.RevealDTO;
import com.individuallearning.application.impostor.dto.RoleDTO;
import com.individuallearning.application.impostor.service.ImpostorApplicationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.individuallearning.domain.impostor.model.Room;
import com.individuallearning.domain.impostor.model.valobj.GamePhase;
import com.individuallearning.domain.impostor.repository.ImpostorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 找出冒牌货 WebSocket 处理器：负责客户端实时通信。
 * <p>
 * 维护 {@code roomId → sessions} 的映射，处理 START/CHAT/VOTE/START_VOTE/RESTART 消息，
 * 并通过广播 STATE、私推 ROLE、广播 CHAT/REVEAL 等消息驱动游戏状态同步。
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ImpostorWebSocketHandler extends TextWebSocketHandler {

    private static final String ATTR_PLAYER_ID = "playerId";
    private static final String ATTR_ROOM_ID = "roomId";

    /** 房间会话映射：roomId → (playerId → session) */
    private final Map<String, Map<String, WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    private final ImpostorApplicationService applicationService;
    private final ImpostorRepository impostorRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ---------- 连接生命周期 ----------

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Map<String, String> params = parseQuery(session.getUri());
        String playerId = params.get(ATTR_PLAYER_ID);
        String roomId = params.get(ATTR_ROOM_ID);

        if (playerId == null || roomId == null) {
            sendError(session, "缺少 playerId 或 roomId 参数");
            closeQuietly(session);
            return;
        }

        session.getAttributes().put(ATTR_PLAYER_ID, playerId);
        session.getAttributes().put(ATTR_ROOM_ID, roomId);

        Map<String, WebSocketSession> sessions = roomSessions
                .computeIfAbsent(roomId, k -> new ConcurrentHashMap<>());
        sessions.put(playerId, session);

        log.info("WebSocket 连接建立 roomId={}, playerId={}", roomId, playerId);

        // 推送当前房间状态
        broadcastState(roomId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String playerId = (String) session.getAttributes().get(ATTR_PLAYER_ID);
        String roomId = (String) session.getAttributes().get(ATTR_ROOM_ID);

        if (roomId == null) {
            return;
        }

        Map<String, WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions != null && playerId != null) {
            sessions.remove(playerId);
            if (sessions.isEmpty()) {
                roomSessions.remove(roomId);
            }
        }

        // 处理玩家离线
        if (playerId != null) {
            try {
                applicationService.handlePlayerDisconnect(roomId, playerId);
            } catch (Exception e) {
                log.warn("处理玩家离线失败 roomId={}, playerId={}: {}", roomId, playerId, e.getMessage());
            }
        }

        log.info("WebSocket 连接关闭 roomId={}, playerId={}, status={}", roomId, playerId, status);
        broadcastState(roomId);
    }

    // ---------- 消息处理 ----------

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String payload = message.getPayload();
        String playerId = (String) session.getAttributes().get(ATTR_PLAYER_ID);
        String roomId = (String) session.getAttributes().get(ATTR_ROOM_ID);

        if (playerId == null || roomId == null) {
            sendError(session, "会话未初始化");
            return;
        }

        JsonNode node;
        try {
            node = objectMapper.readTree(payload);
        } catch (JsonProcessingException e) {
            sendError(session, "消息格式错误");
            return;
        }

        String type = node.path("type").asText("");
        try {
            switch (type) {
                case "START" -> handleStart(roomId, playerId);
                case "CHAT" -> handleChat(roomId, playerId, node.path("text").asText(""));
                case "VOTE" -> handleVote(roomId, playerId, node.path("targetId").asText(null));
                case "START_VOTE" -> handleStartVote(roomId, playerId);
                case "SKIP_SPEAK" -> handleSkipSpeak(roomId, playerId);
                case "RESTART" -> handleRestart(roomId, playerId);
                case "COUNTER_GUESS" -> handleCounterGuess(roomId, playerId, node.path("word").asText(""));
                case "TIMEOUT" -> handleTimeout(roomId);
                default -> sendError(session, "未知消息类型: " + type);
            }
        } catch (Exception e) {
            log.warn("处理消息失败 type={}, roomId={}, playerId={}: {}", type, roomId, playerId, e.getMessage());
            sendError(session, e.getMessage());
        }
    }

    // ---------- 业务分发 ----------

    private void handleStart(String roomId, String playerId) {
        applicationService.startGame(roomId, playerId);
        // 给每个玩家单独推送 ROLE
        Room room = impostorRepository.findById(roomId);
        if (room == null) {
            return;
        }
        for (var p : room.getPlayers()) {
            RoleDTO role = applicationService.getRole(roomId, p.getId());
            sendToPlayer(roomId, p.getId(), buildRolePayload(role));
        }
        broadcastState(roomId);
    }

    private void handleChat(String roomId, String playerId, String text) {
        applicationService.sendChat(roomId, playerId, text);
        // 广播 CHAT 消息
        Room room = impostorRepository.findById(roomId);
        if (room == null || room.getMessages().isEmpty()) {
            return;
        }
        var last = room.getMessages().get(room.getMessages().size() - 1);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "CHAT");
        payload.put("playerId", last.playerId());
        payload.put("playerName", last.playerName());
        payload.put("text", last.text());
        payload.put("timestamp", last.timestamp());
        broadcast(roomId, payload);
    }

    private void handleVote(String roomId, String playerId, String targetId) {
        applicationService.castVote(roomId, playerId, targetId);
        broadcastState(roomId);
        // 全员投完则进入 REVEAL
        if (applicationService.allVoted(roomId)) {
            doReveal(roomId);
        }
    }

    private void handleStartVote(String roomId, String playerId) {
        applicationService.startVoting(roomId, playerId);
        broadcastState(roomId);
    }

    /** 跳过发言：当前发言者主动结束发言，轮到下一位 */
    private void handleSkipSpeak(String roomId, String playerId) {
        applicationService.skipSpeaker(roomId, playerId);
        broadcastState(roomId);
    }

    private void handleRestart(String roomId, String playerId) {
        applicationService.restart(roomId, playerId);
        broadcastState(roomId);
    }

    /**
     * 超时处理：由客户端在倒计时归零时触发。
     * - 讨论阶段超时 → 轮转到下一位发言者（所有人都发完则自动进入投票）
     * - 投票阶段超时 → 触发揭晓
     * - 反猜阶段超时 → 冒牌货反猜失败，平民胜利
     * 幂等（多次调用只生效一次），已被处理时静默忽略。
     */
    private void handleTimeout(String roomId) {
        try {
            Room room = impostorRepository.findById(roomId);
            if (room == null) {
                return;
            }
            if (room.isCounterGuessPhase()) {
                // 反猜阶段超时
                RevealDTO reveal = applicationService.timeoutCounterGuess(roomId);
                broadcastReveal(roomId, reveal);
                broadcastState(roomId);
            } else if (room.getPhase() == GamePhase.DISCUSSING) {
                // 讨论阶段发言超时 → 轮转下一位发言者
                applicationService.advanceSpeaker(roomId);
                broadcastState(roomId);
            } else {
                // 投票阶段超时 → 揭晓
                doReveal(roomId);
            }
        } catch (Exception e) {
            log.debug("超时处理失败 roomId={}: {}", roomId, e.getMessage());
        }
    }

    /**
     * 冒牌货反猜：冒牌货被投出后有一次反猜平民秘密词的机会。
     * 无论猜对猜错，游戏都结束。
     */
    private void handleCounterGuess(String roomId, String playerId, String word) {
        RevealDTO reveal = applicationService.counterGuess(roomId, playerId, word);
        broadcastReveal(roomId, reveal);
        broadcastState(roomId);
    }

    private void doReveal(String roomId) {
        RevealDTO reveal = applicationService.reveal(roomId);
        broadcastReveal(roomId, reveal);
        broadcastState(roomId);
    }

    private void broadcastReveal(String roomId, RevealDTO reveal) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "REVEAL");
        payload.put("impostorId", reveal.impostorId());
        payload.put("impostorName", reveal.impostorName());
        payload.put("secretWord", reveal.secretWord());
        payload.put("impostorWord", reveal.impostorWord());
        payload.put("votedOutId", reveal.votedOutId());
        payload.put("votedOutName", reveal.votedOutName());
        payload.put("impostorCaught", reveal.impostorCaught());
        payload.put("winnerIds", reveal.winnerIds());
        payload.put("gameOver", reveal.gameOver());
        payload.put("counterGuessPhase", reveal.counterGuessPhase());
        payload.put("counterGuessDeadlineMs", reveal.counterGuessDeadlineMs());
        broadcast(roomId, payload);
    }

    // ---------- 推送辅助 ----------

    private void broadcastState(String roomId) {
        GameStateDTO state = applicationService.getGameState(roomId);
        if (state == null) {
            return;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "STATE");
        payload.put("state", buildStateMap(state));
        broadcast(roomId, payload);
    }

    private Map<String, Object> buildStateMap(GameStateDTO s) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("phase", s.phase());
        state.put("players", s.players());
        state.put("deadlineMs", s.deadlineMs());
        state.put("votes", s.votes() == null ? Collections.emptyMap() : s.votes());
        state.put("hostId", s.hostId());
        state.put("discussSeconds", s.discussSeconds());
        state.put("voteSeconds", s.voteSeconds());
        state.put("currentSpeakerId", s.currentSpeakerId());
        state.put("speakerDeadlineMs", s.speakerDeadlineMs());
        state.put("speakerOrder", s.speakerOrder() == null ? Collections.emptyList() : s.speakerOrder());
        return state;
    }

    private Map<String, Object> buildRolePayload(RoleDTO role) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "ROLE");
        payload.put("role", role.role());
        payload.put("word", role.word());
        return payload;
    }

    /** 私推：给指定房间的指定玩家发送消息 */
    private void sendToPlayer(String roomId, String playerId, Map<String, Object> payload) {
        Map<String, WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null) {
            return;
        }
        WebSocketSession session = sessions.get(playerId);
        if (session != null && session.isOpen()) {
            sendJson(session, payload);
        }
    }

    /** 广播：给房间内所有在线 session 发送消息 */
    private void broadcast(String roomId, Map<String, Object> payload) {
        Map<String, WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null) {
            return;
        }
        for (WebSocketSession session : sessions.values()) {
            if (session.isOpen()) {
                sendJson(session, payload);
            }
        }
    }

    private void sendJson(WebSocketSession session, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            session.sendMessage(new TextMessage(json));
        } catch (IOException e) {
            log.warn("发送 WebSocket 消息失败: {}", e.getMessage());
        } catch (IllegalStateException e) {
            log.debug("会话状态异常: {}", e.getMessage());
        }
    }

    private void sendError(WebSocketSession session, String message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "ERROR");
        payload.put("message", message);
        sendJson(session, payload);
    }

    private void closeQuietly(WebSocketSession session) {
        try {
            session.close(CloseStatus.BAD_DATA);
        } catch (IOException e) {
            log.debug("关闭会话失败: {}", e.getMessage());
        }
    }

    /** 解析 URI query 参数 */
    private Map<String, String> parseQuery(URI uri) {
        Map<String, String> params = new HashMap<>();
        if (uri == null) {
            return params;
        }
        String query = uri.getQuery();
        if (query == null || query.isEmpty()) {
            return params;
        }
        for (String pair : query.split("&")) {
            int idx = pair.indexOf('=');
            if (idx > 0) {
                String key = pair.substring(0, idx);
                String value = pair.substring(idx + 1);
                params.put(key, value);
            } else {
                params.put(pair, "");
            }
        }
        return params;
    }
}

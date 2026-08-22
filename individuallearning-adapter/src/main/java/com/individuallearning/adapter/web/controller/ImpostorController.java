package com.individuallearning.adapter.web.controller;

import com.individuallearning.adapter.web.request.CreateRoomRequest;
import com.individuallearning.adapter.web.request.JoinRoomRequest;
import com.individuallearning.application.impostor.dto.CreateRoomResultDTO;
import com.individuallearning.application.impostor.dto.JoinRoomResultDTO;
import com.individuallearning.application.impostor.dto.RoomDTO;
import com.individuallearning.application.impostor.service.ImpostorApplicationService;
import com.individuallearning.common.api.ApiResponse;
import com.individuallearning.common.util.IpUtils;
import com.individuallearning.infrastructure.persistence.service.GameCallLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 找出冒牌货接口
 */
@Tag(name = "找出冒牌货", description = "多人实时推理游戏")
@RestController
@RequestMapping("/api/v1/impostor")
@RequiredArgsConstructor
public class ImpostorController {

    private static final String GAME = "impostor";
    private static final String GAME_NAME = "找出冒牌货";

    private final ImpostorApplicationService impostorApplicationService;
    private final GameCallLogService gameCallLogService;

    @Operation(summary = "创建房间")
    @PostMapping("/room/create")
    public ApiResponse<CreateRoomResultDTO> create(@RequestBody @Valid CreateRoomRequest request,
                                                   HttpServletRequest httpRequest) {
        long start = System.currentTimeMillis();
        boolean success = true;
        String errorMsg = null;
        try {
            return ApiResponse.success(impostorApplicationService.createRoom(request.toCommand()));
        } catch (Exception e) {
            success = false;
            errorMsg = e.getMessage();
            throw e;
        } finally {
            gameCallLogService.asyncLog(
                    GAME, GAME_NAME, "create_room",
                    IpUtils.getClientIp(httpRequest),
                    httpRequest.getRequestURI(),
                    httpRequest.getMethod(),
                    truncate(request == null ? null : request.toString()),
                    System.currentTimeMillis() - start,
                    success, errorMsg,
                    IpUtils.getUserAgent(httpRequest)
            );
        }
    }

    @Operation(summary = "加入房间")
    @PostMapping("/room/join")
    public ApiResponse<JoinRoomResultDTO> join(@RequestBody @Valid JoinRoomRequest request,
                                               HttpServletRequest httpRequest) {
        long start = System.currentTimeMillis();
        boolean success = true;
        String errorMsg = null;
        try {
            return ApiResponse.success(impostorApplicationService.joinRoom(request.toCommand()));
        } catch (Exception e) {
            success = false;
            errorMsg = e.getMessage();
            throw e;
        } finally {
            gameCallLogService.asyncLog(
                    GAME, GAME_NAME, "join_room",
                    IpUtils.getClientIp(httpRequest),
                    httpRequest.getRequestURI(),
                    httpRequest.getMethod(),
                    truncate(request == null ? null : request.toString()),
                    System.currentTimeMillis() - start,
                    success, errorMsg,
                    IpUtils.getUserAgent(httpRequest)
            );
        }
    }

    @Operation(summary = "查询房间状态")
    @GetMapping("/room/{roomId}")
    public ApiResponse<RoomDTO> getRoom(@PathVariable String roomId,
                                        HttpServletRequest httpRequest) {
        long start = System.currentTimeMillis();
        boolean success = true;
        String errorMsg = null;
        try {
            return ApiResponse.success(impostorApplicationService.getRoom(roomId));
        } catch (Exception e) {
            success = false;
            errorMsg = e.getMessage();
            throw e;
        } finally {
            gameCallLogService.asyncLog(
                    GAME, GAME_NAME, "get_room",
                    IpUtils.getClientIp(httpRequest),
                    httpRequest.getRequestURI(),
                    httpRequest.getMethod(),
                    truncate(roomId),
                    System.currentTimeMillis() - start,
                    success, errorMsg,
                    IpUtils.getUserAgent(httpRequest)
            );
        }
    }

    /** 截断参数字符串到 1000 字符，避免日志表 params 字段过大。 */
    private String truncate(String s) {
        if (s == null) {
            return null;
        }
        return s.length() > 1000 ? s.substring(0, 1000) : s;
    }
}

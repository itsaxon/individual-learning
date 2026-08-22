package com.individuallearning.application.auth.service;

import com.individuallearning.application.auth.assembler.AuthAssembler;
import com.individuallearning.application.auth.command.AuthLoginCommand;
import com.individuallearning.application.auth.command.RefreshTokenCommand;
import com.individuallearning.application.auth.dto.TokenDTO;
import com.individuallearning.common.exception.BizException;
import com.individuallearning.domain.auth.model.aggregate.AuthSession;
import com.individuallearning.domain.auth.repository.AuthSessionRepository;
import com.individuallearning.domain.auth.service.AuthDomainService;
import com.individuallearning.domain.auth.service.TokenGenerator;
import com.individuallearning.domain.shared.DomainEventPublisher;
import com.individuallearning.domain.system.model.aggregate.SysUser;
import com.individuallearning.domain.system.model.valobj.Username;
import com.individuallearning.domain.system.repository.SysUserRepository;
import com.individuallearning.domain.system.service.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 认证应用服务：编排登录、刷新、登出用例流程，控制事务、发布领域事件，不承载核心业务规则。
 */
@Service
@RequiredArgsConstructor
public class AuthApplicationService {

    private final AuthDomainService authDomainService;
    private final AuthSessionRepository authSessionRepository;
    private final SysUserRepository sysUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenGenerator tokenGenerator;
    private final DomainEventPublisher domainEventPublisher;

    /**
     * 登录：查找用户 → 校验密码 → 校验启用状态 → 创建会话 → 保存 → 发布事件
     */
    @Transactional(rollbackFor = Exception.class)
    public TokenDTO login(AuthLoginCommand command) {
        SysUser user = sysUserRepository.findByUsername(new Username(command.username()))
                .orElseThrow(() -> new BizException("用户名或密码错误"));
        if (!user.checkPassword(command.password(), passwordEncoder)) {
            throw new BizException("用户名或密码错误");
        }
        if (!user.getStatus().isEnabled()) {
            throw new BizException("账号已被禁用");
        }
        AuthSession session = authDomainService.createSession(
                user.getId(),
                user.getUsername().getValue(),
                command.loginIp(),
                tokenGenerator);
        authSessionRepository.save(session);
        domainEventPublisher.publish(session.pullEvents());
        return AuthAssembler.toTokenDTO(session, user);
    }

    /**
     * 刷新令牌：查找会话 → 获取用户 → 刷新会话 → 保存 → 发布事件
     */
    @Transactional(rollbackFor = Exception.class)
    public TokenDTO refresh(RefreshTokenCommand command) {
        AuthSession session = authSessionRepository.findByRefreshToken(command.refreshToken())
                .orElseThrow(() -> new BizException("刷新令牌无效或已过期"));
        SysUser user = sysUserRepository.findById(session.getUserId())
                .orElseThrow(() -> new BizException("用户不存在"));
        authDomainService.refreshSession(session, user.getUsername().getValue(), tokenGenerator);
        authSessionRepository.save(session);
        domainEventPublisher.publish(session.pullEvents());
        return AuthAssembler.toTokenDTO(session, user);
    }

    /**
     * 登出：查找会话 → 登出 → 保存 → 发布事件
     */
    @Transactional(rollbackFor = Exception.class)
    public void logout(String accessToken) {
        AuthSession session = authSessionRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new BizException("访问令牌无效"));
        authDomainService.logout(session);
        authSessionRepository.save(session);
        domainEventPublisher.publish(session.pullEvents());
    }
}

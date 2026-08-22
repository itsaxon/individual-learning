package com.individuallearning.application.system.service;

import com.individuallearning.application.system.assembler.SysUserAssembler;
import com.individuallearning.application.system.command.ChangePasswordCommand;
import com.individuallearning.application.system.command.LoginCommand;
import com.individuallearning.application.system.command.RegisterCommand;
import com.individuallearning.application.system.dto.SysUserDTO;
import com.individuallearning.common.exception.BizException;
import com.individuallearning.domain.shared.DomainEventPublisher;
import com.individuallearning.domain.system.model.aggregate.SysUser;
import com.individuallearning.domain.system.model.valobj.Email;
import com.individuallearning.domain.system.model.valobj.Password;
import com.individuallearning.domain.system.model.valobj.UserId;
import com.individuallearning.domain.system.model.valobj.Username;
import com.individuallearning.domain.system.repository.SysUserRepository;
import com.individuallearning.domain.system.service.PasswordEncoder;
import com.individuallearning.domain.system.service.SysUserDomainService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户应用服务：编排用例流程、控制事务、发布领域事件，不承载核心业务规则。
 */
@Service
@RequiredArgsConstructor
public class SysUserApplicationService {

    private final SysUserDomainService sysUserDomainService;
    private final SysUserRepository sysUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final DomainEventPublisher domainEventPublisher;

    /**
     * 注册
     */
    @Transactional(rollbackFor = Exception.class)
    public SysUserDTO register(RegisterCommand command) {
        Username username = new Username(command.username());
        Email email = new Email(command.email());
        Password password = Password.encode(command.password(), passwordEncoder);

        SysUser user = sysUserDomainService.register(username, password, email);
        sysUserRepository.save(user);
        domainEventPublisher.publish(user.pullEvents());
        return SysUserAssembler.toDTO(user);
    }

    /**
     * 登录校验
     */
    public SysUserDTO login(LoginCommand command) {
        SysUser user = sysUserRepository.findByUsername(new Username(command.username()))
                .orElseThrow(() -> new BizException("用户名或密码错误"));
        if (!user.checkPassword(command.password(), passwordEncoder)) {
            throw new BizException("用户名或密码错误");
        }
        if (!user.getStatus().isEnabled()) {
            throw new BizException("账号已被禁用");
        }
        return SysUserAssembler.toDTO(user);
    }

    /**
     * 修改密码
     */
    @Transactional(rollbackFor = Exception.class)
    public void changePassword(ChangePasswordCommand command) {
        SysUser user = loadUser(command.userId());
        user.changePassword(command.oldPassword(), command.newPassword(), passwordEncoder);
        sysUserRepository.save(user);
        domainEventPublisher.publish(user.pullEvents());
    }

    /**
     * 查看用户信息
     */
    public SysUserDTO getProfile(Long userId) {
        return SysUserAssembler.toDTO(loadUser(userId));
    }

    /**
     * 禁用用户
     */
    @Transactional(rollbackFor = Exception.class)
    public void disable(Long userId) {
        SysUser user = loadUser(userId);
        user.disable();
        sysUserRepository.save(user);
    }

    /**
     * 启用用户
     */
    @Transactional(rollbackFor = Exception.class)
    public void enable(Long userId) {
        SysUser user = loadUser(userId);
        user.enable();
        sysUserRepository.save(user);
    }

    private SysUser loadUser(Long userId) {
        return sysUserRepository.findById(new UserId(userId))
                .orElseThrow(() -> new BizException("用户不存在"));
    }
}

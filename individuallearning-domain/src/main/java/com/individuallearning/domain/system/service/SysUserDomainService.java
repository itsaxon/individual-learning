package com.individuallearning.domain.system.service;

import com.individuallearning.common.exception.DomainException;
import com.individuallearning.domain.shared.IdGenerator;
import com.individuallearning.domain.system.model.aggregate.SysUser;
import com.individuallearning.domain.system.model.valobj.Email;
import com.individuallearning.domain.system.model.valobj.Password;
import com.individuallearning.domain.system.model.valobj.UserId;
import com.individuallearning.domain.system.model.valobj.Username;
import com.individuallearning.domain.system.repository.SysUserRepository;

/**
 * 用户领域服务：处理跨聚合或需要仓储协作的领域逻辑（如用户名唯一性校验）。
 * 纯 POJO，由基础设施层装配为 Spring Bean。
 */
public class SysUserDomainService {

    private final SysUserRepository userRepository;
    private final IdGenerator idGenerator;

    public SysUserDomainService(SysUserRepository userRepository, IdGenerator idGenerator) {
        this.userRepository = userRepository;
        this.idGenerator = idGenerator;
    }

    /**
     * 注册用户：校验用户名唯一 → 预生成 ID → 委托聚合工厂创建
     */
    public SysUser register(Username username, Password password, Email email) {
        if (userRepository.existsByUsername(username)) {
            throw new DomainException("用户名已存在");
        }
        UserId userId = new UserId(idGenerator.nextId());
        return SysUser.register(userId, username, password, email);
    }
}

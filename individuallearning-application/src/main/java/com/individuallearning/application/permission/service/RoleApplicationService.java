package com.individuallearning.application.permission.service;

import com.individuallearning.application.permission.assembler.RoleAssembler;
import com.individuallearning.application.permission.command.AssignRoleCommand;
import com.individuallearning.application.permission.command.CreateRoleCommand;
import com.individuallearning.application.permission.command.GrantPermissionCommand;
import com.individuallearning.application.permission.command.UpdateRoleCommand;
import com.individuallearning.application.permission.dto.RoleDTO;
import com.individuallearning.common.exception.BizException;
import com.individuallearning.domain.permission.model.aggregate.Role;
import com.individuallearning.domain.permission.model.valobj.PermissionCode;
import com.individuallearning.domain.permission.model.valobj.PermissionId;
import com.individuallearning.domain.permission.model.valobj.RoleCode;
import com.individuallearning.domain.permission.model.valobj.RoleId;
import com.individuallearning.domain.permission.repository.RoleRepository;
import com.individuallearning.domain.permission.repository.UserRoleRepository;
import com.individuallearning.domain.permission.service.PermissionDomainService;
import com.individuallearning.domain.shared.DomainEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 角色应用服务：编排用例流程、控制事务、发布领域事件，不承载核心业务规则。
 */
@Service
@RequiredArgsConstructor
public class RoleApplicationService {

    private final PermissionDomainService permissionDomainService;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final DomainEventPublisher domainEventPublisher;

    /**
     * 创建角色
     */
    @Transactional(rollbackFor = Exception.class)
    public RoleDTO createRole(CreateRoleCommand command) {
        RoleCode code = new RoleCode(command.code());
        Role role = permissionDomainService.createRole(code, command.name(), command.description());
        roleRepository.save(role);
        domainEventPublisher.publish(role.pullEvents());
        return RoleAssembler.toDTO(role);
    }

    /**
     * 更新角色信息
     */
    @Transactional(rollbackFor = Exception.class)
    public RoleDTO updateRole(UpdateRoleCommand command) {
        Role role = loadRole(command.roleId());
        role.updateInfo(command.name(), command.description());
        roleRepository.save(role);
        domainEventPublisher.publish(role.pullEvents());
        return RoleAssembler.toDTO(role);
    }

    /**
     * 授予权限
     */
    @Transactional(rollbackFor = Exception.class)
    public void grantPermission(GrantPermissionCommand command) {
        Role role = permissionDomainService.grantPermission(new RoleId(command.roleId()), new PermissionId(command.permissionId()));
        roleRepository.save(role);
        domainEventPublisher.publish(role.pullEvents());
    }

    /**
     * 撤销权限
     */
    @Transactional(rollbackFor = Exception.class)
    public void revokePermission(Long roleId, Long permissionId) {
        Role role = permissionDomainService.revokePermission(new RoleId(roleId), new PermissionId(permissionId));
        roleRepository.save(role);
        domainEventPublisher.publish(role.pullEvents());
    }

    /**
     * 分配角色给用户
     */
    @Transactional(rollbackFor = Exception.class)
    public void assignRole(AssignRoleCommand command) {
        userRoleRepository.assign(command.userId(), new RoleId(command.roleId()));
    }

    /**
     * 撤销用户的角色
     */
    @Transactional(rollbackFor = Exception.class)
    public void revokeRole(Long userId, Long roleId) {
        userRoleRepository.revoke(userId, new RoleId(roleId));
    }

    /**
     * 查看角色
     */
    public RoleDTO getRole(Long roleId) {
        return RoleAssembler.toDTO(loadRole(roleId));
    }

    /**
     * 查询所有角色
     */
    public List<RoleDTO> listRoles() {
        return roleRepository.findAll().stream()
                .map(RoleAssembler::toDTO)
                .collect(Collectors.toList());
    }

    private Role loadRole(Long roleId) {
        return roleRepository.findById(new RoleId(roleId))
                .orElseThrow(() -> new BizException("角色不存在"));
    }
}

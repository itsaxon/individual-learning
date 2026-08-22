package com.individuallearning.application.permission.service;

import com.individuallearning.application.permission.assembler.PermissionAssembler;
import com.individuallearning.application.permission.command.CreatePermissionCommand;
import com.individuallearning.application.permission.command.UpdatePermissionCommand;
import com.individuallearning.application.permission.dto.PermissionDTO;
import com.individuallearning.common.exception.BizException;
import com.individuallearning.domain.permission.model.aggregate.Permission;
import com.individuallearning.domain.permission.model.valobj.PermissionCode;
import com.individuallearning.domain.permission.model.valobj.PermissionId;
import com.individuallearning.domain.permission.model.valobj.PermissionType;
import com.individuallearning.domain.permission.repository.PermissionRepository;
import com.individuallearning.domain.permission.service.PermissionDomainService;
import com.individuallearning.domain.shared.DomainEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 权限应用服务：编排用例流程、控制事务、发布领域事件，不承载核心业务规则。
 */
@Service
@RequiredArgsConstructor
public class PermissionApplicationService {

    private final PermissionDomainService permissionDomainService;
    private final PermissionRepository permissionRepository;
    private final DomainEventPublisher domainEventPublisher;

    /**
     * 创建权限
     */
    @Transactional(rollbackFor = Exception.class)
    public PermissionDTO createPermission(CreatePermissionCommand command) {
        PermissionCode code = new PermissionCode(command.code());
        PermissionType type = PermissionType.of(command.type());
        Long parentId = command.parentId();
        int sort = command.sort() == null ? 0 : command.sort();
        Permission permission = permissionDomainService.createPermission(code, command.name(), type, parentId, sort);
        permissionRepository.save(permission);
        domainEventPublisher.publish(permission.pullEvents());
        return PermissionAssembler.toDTO(permission);
    }

    /**
     * 更新权限信息
     */
    @Transactional(rollbackFor = Exception.class)
    public PermissionDTO updatePermission(UpdatePermissionCommand command) {
        Permission permission = loadPermission(command.permissionId());
        permission.updateInfo(command.name(), command.parentId(),
                command.sort() == null ? 0 : command.sort());
        permissionRepository.save(permission);
        domainEventPublisher.publish(permission.pullEvents());
        return PermissionAssembler.toDTO(permission);
    }

    /**
     * 查看权限
     */
    public PermissionDTO getPermission(Long permissionId) {
        return PermissionAssembler.toDTO(loadPermission(permissionId));
    }

    /**
     * 查询所有权限
     */
    public List<PermissionDTO> listPermissions() {
        return permissionRepository.findAll().stream()
                .map(PermissionAssembler::toDTO)
                .collect(Collectors.toList());
    }

    private Permission loadPermission(Long permissionId) {
        return permissionRepository.findById(new PermissionId(permissionId))
                .orElseThrow(() -> new BizException("权限不存在"));
    }
}

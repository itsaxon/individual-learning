package com.individuallearning.infrastructure.persistence.repository;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.individuallearning.domain.permission.model.valobj.RoleId;
import com.individuallearning.domain.permission.repository.UserRoleRepository;
import com.individuallearning.infrastructure.persistence.mapper.UserRoleMapper;
import com.individuallearning.infrastructure.persistence.po.UserRolePO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 用户-角色关联仓储实现：领域层 UserRoleRepository 端口的具体实现，依赖 MyBatis Plus。
 */
@Repository
@RequiredArgsConstructor
public class UserRoleRepositoryImpl implements UserRoleRepository {

    private final UserRoleMapper mapper;

    @Override
    public void assign(Long userId, RoleId roleId) {
        if (exists(userId, roleId)) {
            return;
        }
        UserRolePO po = new UserRolePO();
        po.setUserId(userId);
        po.setRoleId(roleId.getValue());
        mapper.insert(po);
    }

    @Override
    public void revoke(Long userId, RoleId roleId) {
        mapper.delete(Wrappers.<UserRolePO>lambdaQuery()
                .eq(UserRolePO::getUserId, userId)
                .eq(UserRolePO::getRoleId, roleId.getValue()));
    }

    @Override
    public List<RoleId> findRoleIdsByUserId(Long userId) {
        List<UserRolePO> pos = mapper.selectList(Wrappers.<UserRolePO>lambdaQuery()
                .eq(UserRolePO::getUserId, userId));
        if (pos.isEmpty()) {
            return Collections.emptyList();
        }
        return pos.stream().map(po -> new RoleId(po.getRoleId())).collect(Collectors.toList());
    }

    @Override
    public List<Long> findUserIdsByRoleId(RoleId roleId) {
        List<UserRolePO> pos = mapper.selectList(Wrappers.<UserRolePO>lambdaQuery()
                .eq(UserRolePO::getRoleId, roleId.getValue()));
        if (pos.isEmpty()) {
            return Collections.emptyList();
        }
        return pos.stream().map(UserRolePO::getUserId).collect(Collectors.toList());
    }

    @Override
    public boolean exists(Long userId, RoleId roleId) {
        return mapper.exists(Wrappers.<UserRolePO>lambdaQuery()
                .eq(UserRolePO::getUserId, userId)
                .eq(UserRolePO::getRoleId, roleId.getValue()));
    }
}

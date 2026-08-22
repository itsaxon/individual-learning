package com.individuallearning.infrastructure.persistence.repository;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.toolkit.Db;
import com.individuallearning.domain.permission.model.aggregate.Permission;
import com.individuallearning.domain.permission.model.valobj.PermissionCode;
import com.individuallearning.domain.permission.model.valobj.PermissionId;
import com.individuallearning.domain.permission.repository.PermissionRepository;
import com.individuallearning.infrastructure.persistence.converter.PermissionConverter;
import com.individuallearning.infrastructure.persistence.mapper.PermissionMapper;
import com.individuallearning.infrastructure.persistence.po.PermissionPO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 权限仓储实现：领域层 PermissionRepository 端口的具体实现，依赖 MyBatis Plus。
 */
@Repository
@RequiredArgsConstructor
public class PermissionRepositoryImpl implements PermissionRepository {

    private final PermissionMapper mapper;

    @Override
    public Optional<Permission> findById(PermissionId id) {
        PermissionPO po = mapper.selectById(id.getValue());
        return Optional.ofNullable(PermissionConverter.toDomain(po));
    }

    @Override
    public Optional<Permission> findByCode(PermissionCode code) {
        PermissionPO po = mapper.selectOne(Wrappers.<PermissionPO>lambdaQuery()
                .eq(PermissionPO::getCode, code.getValue()));
        return Optional.ofNullable(PermissionConverter.toDomain(po));
    }

    @Override
    public boolean existsByCode(PermissionCode code) {
        return mapper.exists(Wrappers.<PermissionPO>lambdaQuery()
                .eq(PermissionPO::getCode, code.getValue()));
    }

    @Override
    public List<Permission> findAll() {
        List<PermissionPO> pos = mapper.selectList(null);
        if (pos.isEmpty()) {
            return Collections.emptyList();
        }
        return pos.stream().map(PermissionConverter::toDomain).collect(Collectors.toList());
    }

    @Override
    public void save(Permission permission) {
        PermissionPO po = PermissionConverter.toPO(permission);
        Db.saveOrUpdate(po);
    }

    @Override
    public void remove(PermissionId id) {
        mapper.deleteById(id.getValue());
    }
}

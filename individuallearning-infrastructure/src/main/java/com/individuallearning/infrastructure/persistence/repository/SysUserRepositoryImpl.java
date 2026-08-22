package com.individuallearning.infrastructure.persistence.repository;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.toolkit.Db;
import com.individuallearning.domain.system.model.aggregate.SysUser;
import com.individuallearning.domain.system.model.valobj.UserId;
import com.individuallearning.domain.system.model.valobj.Username;
import com.individuallearning.domain.system.repository.SysUserRepository;
import com.individuallearning.infrastructure.persistence.converter.SysUserConverter;
import com.individuallearning.infrastructure.persistence.mapper.SysUserMapper;
import com.individuallearning.infrastructure.persistence.po.SysUserPO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 用户仓储实现：领域层 SysUserRepository 端口的具体实现，依赖 MyBatis Plus。
 */
@Repository
@RequiredArgsConstructor
public class SysUserRepositoryImpl implements SysUserRepository {

    private final SysUserMapper mapper;

    @Override
    public Optional<SysUser> findById(UserId id) {
        SysUserPO po = mapper.selectById(id.getValue());
        return Optional.ofNullable(SysUserConverter.toDomain(po));
    }

    @Override
    public Optional<SysUser> findByUsername(Username username) {
        SysUserPO po = mapper.selectOne(Wrappers.<SysUserPO>lambdaQuery()
                .eq(SysUserPO::getUsername, username.getValue()));
        return Optional.ofNullable(SysUserConverter.toDomain(po));
    }

    @Override
    public boolean existsByUsername(Username username) {
        return mapper.exists(Wrappers.<SysUserPO>lambdaQuery()
                .eq(SysUserPO::getUsername, username.getValue()));
    }

    @Override
    public void save(SysUser user) {
        SysUserPO po = SysUserConverter.toPO(user);
        Db.saveOrUpdate(po);
    }

    @Override
    public void remove(UserId id) {
        mapper.deleteById(id.getValue());
    }
}

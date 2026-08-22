package com.individuallearning.infrastructure.persistence.repository;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.toolkit.Db;
import com.individuallearning.domain.auth.model.aggregate.AuthSession;
import com.individuallearning.domain.auth.model.valobj.SessionId;
import com.individuallearning.domain.auth.repository.AuthSessionRepository;
import com.individuallearning.infrastructure.persistence.converter.AuthSessionConverter;
import com.individuallearning.infrastructure.persistence.mapper.AuthSessionMapper;
import com.individuallearning.infrastructure.persistence.po.AuthSessionPO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 认证会话仓储实现：领域层 AuthSessionRepository 端口的具体实现，依赖 MyBatis Plus。
 */
@Repository
@RequiredArgsConstructor
public class AuthSessionRepositoryImpl implements AuthSessionRepository {

    private final AuthSessionMapper mapper;

    @Override
    public Optional<AuthSession> findById(SessionId id) {
        AuthSessionPO po = mapper.selectById(id.getValue());
        return Optional.ofNullable(AuthSessionConverter.toDomain(po));
    }

    @Override
    public Optional<AuthSession> findByAccessToken(String accessToken) {
        AuthSessionPO po = mapper.selectOne(Wrappers.<AuthSessionPO>lambdaQuery()
                .eq(AuthSessionPO::getAccessToken, accessToken));
        return Optional.ofNullable(AuthSessionConverter.toDomain(po));
    }

    @Override
    public Optional<AuthSession> findByRefreshToken(String refreshToken) {
        AuthSessionPO po = mapper.selectOne(Wrappers.<AuthSessionPO>lambdaQuery()
                .eq(AuthSessionPO::getRefreshToken, refreshToken));
        return Optional.ofNullable(AuthSessionConverter.toDomain(po));
    }

    @Override
    public void save(AuthSession session) {
        AuthSessionPO po = AuthSessionConverter.toPO(session);
        Db.saveOrUpdate(po);
    }

    @Override
    public void remove(SessionId id) {
        mapper.deleteById(id.getValue());
    }
}

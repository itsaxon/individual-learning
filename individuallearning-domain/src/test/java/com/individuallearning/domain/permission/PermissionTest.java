package com.individuallearning.domain.permission;

import com.individuallearning.common.exception.DomainException;
import com.individuallearning.domain.permission.model.aggregate.Permission;
import com.individuallearning.domain.permission.model.valobj.PermissionCode;
import com.individuallearning.domain.permission.model.valobj.PermissionId;
import com.individuallearning.domain.permission.model.valobj.PermissionType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Permission 聚合根单元测试：验证权限生命周期与领域规则。
 */
class PermissionTest {

    @Test
    @DisplayName("create：创建成功，字段正确，status=启用")
    void create_shouldBuildPermission() {
        PermissionId id = new PermissionId(1L);
        PermissionCode code = new PermissionCode("user:create");

        Permission permission = Permission.create(id, code, "创建用户",
                PermissionType.api(), 0L, 10);

        assertThat(permission.getId()).isEqualTo(id);
        assertThat(permission.getCode().getValue()).isEqualTo("user:create");
        assertThat(permission.getName()).isEqualTo("创建用户");
        assertThat(permission.getType().isApi()).isTrue();
        assertThat(permission.getParentId()).isEqualTo(0L);
        assertThat(permission.getSort()).isEqualTo(10);
        assertThat(permission.getStatus().getCode()).isEqualTo(1);
        assertThat(permission.getCreateTime()).isNotNull();
        assertThat(permission.getUpdateTime()).isNotNull();
        assertThat(permission.domainEvents()).isEmpty();
    }

    @Test
    @DisplayName("updateInfo：正常修改 name、parentId、sort")
    void updateInfo_shouldUpdateFields() {
        Permission permission = createPermission();

        permission.updateInfo("创建用户V2", 100L, 20);

        assertThat(permission.getName()).isEqualTo("创建用户V2");
        assertThat(permission.getParentId()).isEqualTo(100L);
        assertThat(permission.getSort()).isEqualTo(20);
    }

    @Test
    @DisplayName("updateInfo：空 name → 抛 DomainException")
    void updateInfo_shouldThrowWhenNameBlank() {
        Permission permission = createPermission();

        assertThatThrownBy(() -> permission.updateInfo("", 1L, 1))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("权限名称不能为空");
    }

    @Test
    @DisplayName("disable：启用状态 → 成功禁用")
    void disable_shouldSucceedWhenEnabled() {
        Permission permission = createPermission();
        assertThat(permission.getStatus().getCode()).isEqualTo(1);

        permission.disable();

        assertThat(permission.getStatus().getCode()).isEqualTo(0);
    }

    @Test
    @DisplayName("enable：禁用状态 → 成功启用")
    void enable_shouldSucceedWhenDisabled() {
        Permission permission = createPermission();
        permission.disable();

        permission.enable();

        assertThat(permission.getStatus().getCode()).isEqualTo(1);
    }

    @Test
    @DisplayName("enable：重复启用 → 抛 DomainException")
    void enable_shouldThrowWhenAlreadyEnabled() {
        Permission permission = createPermission();

        assertThatThrownBy(permission::enable)
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("已是启用状态");
    }

    @Test
    @DisplayName("disable：重复禁用 → 抛 DomainException")
    void disable_shouldThrowWhenAlreadyDisabled() {
        Permission permission = createPermission();
        permission.disable();

        assertThatThrownBy(permission::disable)
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("已是禁用状态");
    }

    @Test
    @DisplayName("reconstitute：重建后字段一致")
    void reconstitute_shouldRestoreFields() {
        PermissionId id = new PermissionId(2L);
        PermissionCode code = new PermissionCode("user:read");
        Instant createTime = Instant.parse("2025-01-01T00:00:00Z");
        Instant updateTime = Instant.parse("2025-06-01T00:00:00Z");

        Permission permission = Permission.reconstitute(id, code, "查看用户",
                PermissionType.menu(), 5L, 1, 0, createTime, updateTime);

        assertThat(permission.getId()).isEqualTo(id);
        assertThat(permission.getCode().getValue()).isEqualTo("user:read");
        assertThat(permission.getName()).isEqualTo("查看用户");
        assertThat(permission.getType().isMenu()).isTrue();
        assertThat(permission.getParentId()).isEqualTo(5L);
        assertThat(permission.getSort()).isEqualTo(1);
        assertThat(permission.getStatus().getCode()).isEqualTo(0);
        assertThat(permission.getCreateTime()).isEqualTo(createTime);
        assertThat(permission.getUpdateTime()).isEqualTo(updateTime);
        assertThat(permission.domainEvents()).isEmpty();
    }

    /** 创建一个默认权限 */
    private Permission createPermission() {
        return Permission.create(new PermissionId(1L), new PermissionCode("user:create"),
                "创建用户", PermissionType.api(), 0L, 10);
    }
}

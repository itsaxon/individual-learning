package com.individuallearning.domain.permission;

import com.individuallearning.common.exception.DomainException;
import com.individuallearning.domain.permission.model.aggregate.Role;
import com.individuallearning.domain.permission.model.event.PermissionGrantedEvent;
import com.individuallearning.domain.permission.model.event.PermissionRevokedEvent;
import com.individuallearning.domain.permission.model.event.RoleCreatedEvent;
import com.individuallearning.domain.permission.model.valobj.PermissionId;
import com.individuallearning.domain.permission.model.valobj.RoleCode;
import com.individuallearning.domain.permission.model.valobj.RoleId;
import com.individuallearning.domain.shared.DomainEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Role 聚合根单元测试：验证角色生命周期、权限授予/撤销与领域规则。
 */
class RoleTest {

    @Test
    @DisplayName("create：创建成功，字段正确，permissions 为空集，status=启用，产生 RoleCreatedEvent")
    void create_shouldBuildRoleAndRaiseEvent() {
        RoleId id = new RoleId(1L);
        RoleCode code = new RoleCode("ADMIN");

        Role role = Role.create(id, code, "管理员", "系统管理员");

        assertThat(role.getId()).isEqualTo(id);
        assertThat(role.getCode().getValue()).isEqualTo("ADMIN");
        assertThat(role.getName()).isEqualTo("管理员");
        assertThat(role.getDescription()).isEqualTo("系统管理员");
        assertThat(role.getStatus().getCode()).isEqualTo(1);
        assertThat(role.getPermissions()).isEmpty();
        assertThat(role.getCreateTime()).isNotNull();
        assertThat(role.getUpdateTime()).isNotNull();

        // 验证事件
        assertThat(role.domainEvents()).hasSize(1);
        DomainEvent event = role.domainEvents().get(0);
        assertThat(event).isInstanceOf(RoleCreatedEvent.class);
        RoleCreatedEvent created = (RoleCreatedEvent) event;
        assertThat(created.getRoleId()).isEqualTo(1L);
        assertThat(created.getRoleCode()).isEqualTo("ADMIN");
        assertThat(created.getRoleName()).isEqualTo("管理员");
    }

    @Test
    @DisplayName("grantPermission：授权成功，permissions 包含该 ID，产生 PermissionGrantedEvent")
    void grantPermission_shouldAddAndRaiseEvent() {
        Role role = createRole();
        PermissionId permId = new PermissionId(10L);

        role.grantPermission(permId);

        assertThat(role.getPermissions()).contains(permId);
        assertThat(role.hasPermission(permId)).isTrue();
        assertThat(role.domainEvents())
                .anyMatch(e -> e instanceof PermissionGrantedEvent);
    }

    @Test
    @DisplayName("grantPermission：重复授权 → 抛 DomainException")
    void grantPermission_shouldThrowWhenDuplicate() {
        Role role = createRole();
        PermissionId permId = new PermissionId(10L);
        role.grantPermission(permId);

        assertThatThrownBy(() -> role.grantPermission(permId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("该权限已授予");
    }

    @Test
    @DisplayName("revokePermission：撤销成功，permissions 不含该 ID，产生 PermissionRevokedEvent")
    void revokePermission_shouldRemoveAndRaiseEvent() {
        Role role = createRole();
        PermissionId permId = new PermissionId(10L);
        role.grantPermission(permId);

        role.revokePermission(permId);

        assertThat(role.getPermissions()).doesNotContain(permId);
        assertThat(role.hasPermission(permId)).isFalse();
        assertThat(role.domainEvents())
                .anyMatch(e -> e instanceof PermissionRevokedEvent);
    }

    @Test
    @DisplayName("revokePermission：撤销未授权的权限 → 抛 DomainException")
    void revokePermission_shouldThrowWhenNotGranted() {
        Role role = createRole();
        PermissionId permId = new PermissionId(10L);

        assertThatThrownBy(() -> role.revokePermission(permId))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("未授予该权限");
    }

    @Test
    @DisplayName("disable：启用状态 → 成功禁用")
    void disable_shouldSucceedWhenEnabled() {
        Role role = createRole();
        assertThat(role.getStatus().getCode()).isEqualTo(1);

        role.disable();

        assertThat(role.getStatus().getCode()).isEqualTo(0);
    }

    @Test
    @DisplayName("enable：禁用状态 → 成功启用")
    void enable_shouldSucceedWhenDisabled() {
        Role role = createRole();
        role.disable();

        role.enable();

        assertThat(role.getStatus().getCode()).isEqualTo(1);
    }

    @Test
    @DisplayName("enable：重复启用 → 抛 DomainException")
    void enable_shouldThrowWhenAlreadyEnabled() {
        Role role = createRole();

        assertThatThrownBy(role::enable)
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("已是启用状态");
    }

    @Test
    @DisplayName("disable：重复禁用 → 抛 DomainException")
    void disable_shouldThrowWhenAlreadyDisabled() {
        Role role = createRole();
        role.disable();

        assertThatThrownBy(role::disable)
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("已是禁用状态");
    }

    @Test
    @DisplayName("updateInfo：正常修改 name 和 description")
    void updateInfo_shouldUpdateNameAndDescription() {
        Role role = createRole();

        role.updateInfo("超级管理员", "全权限角色");

        assertThat(role.getName()).isEqualTo("超级管理员");
        assertThat(role.getDescription()).isEqualTo("全权限角色");
    }

    @Test
    @DisplayName("updateInfo：空 name → 抛 DomainException")
    void updateInfo_shouldThrowWhenNameBlank() {
        Role role = createRole();

        assertThatThrownBy(() -> role.updateInfo("", "描述"))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("角色名称不能为空");
    }

    @Test
    @DisplayName("hasPermission：正确判断权限归属")
    void hasPermission_shouldReflectPermissionSet() {
        Role role = createRole();
        PermissionId granted = new PermissionId(10L);
        PermissionId notGranted = new PermissionId(20L);
        role.grantPermission(granted);

        assertThat(role.hasPermission(granted)).isTrue();
        assertThat(role.hasPermission(notGranted)).isFalse();
    }

    @Test
    @DisplayName("reconstitute：重建后字段和 permissions 集合一致")
    void reconstitute_shouldRestoreFieldsAndPermissions() {
        RoleId id = new RoleId(2L);
        RoleCode code = new RoleCode("USER");
        Instant createTime = Instant.parse("2025-01-01T00:00:00Z");
        Instant updateTime = Instant.parse("2025-06-01T00:00:00Z");
        Set<PermissionId> permissions = Set.of(new PermissionId(1L), new PermissionId(2L));

        Role role = Role.reconstitute(id, code, "用户", "普通用户", 1,
                permissions, createTime, updateTime);

        assertThat(role.getId()).isEqualTo(id);
        assertThat(role.getCode().getValue()).isEqualTo("USER");
        assertThat(role.getName()).isEqualTo("用户");
        assertThat(role.getDescription()).isEqualTo("普通用户");
        assertThat(role.getStatus().getCode()).isEqualTo(1);
        assertThat(role.getPermissions()).containsExactlyInAnyOrderElementsOf(permissions);
        assertThat(role.getCreateTime()).isEqualTo(createTime);
        assertThat(role.getUpdateTime()).isEqualTo(updateTime);
        assertThat(role.domainEvents()).isEmpty();
    }

    /** 创建一个默认角色 */
    private Role createRole() {
        return Role.create(new RoleId(1L), new RoleCode("ADMIN"), "管理员", "系统管理员");
    }
}

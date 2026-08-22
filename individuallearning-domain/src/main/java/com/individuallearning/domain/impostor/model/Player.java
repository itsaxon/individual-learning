package com.individuallearning.domain.impostor.model;

import com.individuallearning.domain.impostor.model.valobj.ImpostorRole;

import java.util.Objects;

/**
 * 玩家值对象（不可变，通过 with* 方法生成新实例）。
 * <p>
 * 字段：id、name、role、online、voted、voteTarget、eliminated。
 * eliminated 表示玩家是否已被投出淘汰，淘汰后不参与后续讨论与投票。
 */
public final class Player {

    private final String id;
    private final String name;
    private final ImpostorRole role;
    private final boolean online;
    private final boolean voted;
    private final String voteTarget;
    private final boolean eliminated;

    public Player(String id, String name, ImpostorRole role, boolean online, boolean voted, String voteTarget, boolean eliminated) {
        this.id = id;
        this.name = name;
        this.role = role;
        this.online = online;
        this.voted = voted;
        this.voteTarget = voteTarget;
        this.eliminated = eliminated;
    }

    /** 兼容旧构造器：默认未淘汰 */
    public Player(String id, String name, ImpostorRole role, boolean online, boolean voted, String voteTarget) {
        this(id, name, role, online, voted, voteTarget, false);
    }

    /** 创建一个新加入房间的玩家（默认在线、未投票、无角色、未淘汰） */
    public static Player newJoiner(String id, String name) {
        return new Player(id, name, null, true, false, null, false);
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public ImpostorRole getRole() {
        return role;
    }

    public boolean isOnline() {
        return online;
    }

    public boolean isVoted() {
        return voted;
    }

    public String getVoteTarget() {
        return voteTarget;
    }

    public boolean isEliminated() {
        return eliminated;
    }

    public Player withRole(ImpostorRole role) {
        return new Player(this.id, this.name, role, this.online, this.voted, this.voteTarget, this.eliminated);
    }

    public Player withOnline(boolean online) {
        return new Player(this.id, this.name, this.role, online, this.voted, this.voteTarget, this.eliminated);
    }

    public Player withVoted(boolean voted) {
        return new Player(this.id, this.name, this.role, this.online, voted, this.voteTarget, this.eliminated);
    }

    public Player withVoteTarget(String voteTarget) {
        return new Player(this.id, this.name, this.role, this.online, this.voted, voteTarget, this.eliminated);
    }

    public Player withEliminated(boolean eliminated) {
        return new Player(this.id, this.name, this.role, this.online, this.voted, this.voteTarget, eliminated);
    }

    /** 重置为新一轮的玩家（保留 id/name，清空角色与投票状态，保留淘汰状态由 reset 控制位决定） */
    public Player resetForNewRound() {
        return new Player(this.id, this.name, null, true, false, null, false);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Player player)) {
            return false;
        }
        return Objects.equals(id, player.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

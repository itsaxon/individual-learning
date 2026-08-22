package com.individuallearning.adapter.common;

import com.individuallearning.domain.system.model.event.UserPasswordChangedEvent;
import com.individuallearning.domain.system.model.event.UserRegisteredEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 用户领域事件监听器：演示领域事件的解耦处理。
 * 实际项目可在此触发积分发放、欢迎消息、优惠券等副作用。
 */
@Slf4j
@Component
public class UserEventListener {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUserRegistered(UserRegisteredEvent event) {
        log.info("用户注册成功事件：userId={}, username={}", event.getUserId(), event.getUsername());
        // 示例：实际项目可在此发送欢迎邮件、赠送积分、发放新人优惠券等
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPasswordChanged(UserPasswordChangedEvent event) {
        log.info("用户密码修改事件：userId={}", event.getUserId());
        // 示例：实际项目可在此通知用户、清理其他登录态等
    }
}

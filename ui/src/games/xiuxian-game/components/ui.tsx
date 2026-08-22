/**
 * 修仙游戏 — 通用 UI 组件
 *
 * 白色亮色主题（与词海寻踪/九宫寻数一致）。
 * 仅使用 Tailwind CSS，不引入新依赖。
 */
import { type ReactNode, type ButtonHTMLAttributes, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { Quality } from '../logic/types'

/* ============ 品质色映射 ============ */
export const qualityClass: Record<Quality, string> = {
  info: 'text-slate-700 border-slate-300 bg-slate-100',
  success: 'text-emerald-700 border-emerald-300 bg-emerald-100',
  primary: 'text-sky-700 border-sky-300 bg-sky-100',
  purple: 'text-purple-700 border-purple-300 bg-purple-100',
  warning: 'text-blue-700 border-blue-300 bg-blue-100',
  danger: 'text-rose-700 border-rose-300 bg-rose-100',
  pink: 'text-pink-700 border-pink-300 bg-pink-100',
}

export const qualityText: Record<Quality, string> = {
  info: '黄阶',
  success: '玄阶',
  primary: '地阶',
  purple: '天阶',
  warning: '帝阶',
  danger: '神阶',
  pink: '仙阶',
}

/* ============ Panel：玻璃态卡片（亮色） ============ */
export function Panel({
  children,
  className = '',
  glow = false,
}: {
  children: ReactNode
  className?: string
  glow?: boolean
}) {
  return (
    <div
      className={
        'relative rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-md ' +
        (glow ? 'shadow-[0_4px_24px_-8px_rgba(245,158,11,0.20)] ' : '') +
        className
      }
    >
      {children}
    </div>
  )
}

/* ============ Button：通用按钮 ============ */
type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'gold' | 'violet'

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:from-blue-600 hover:to-sky-600 shadow-[0_4px_14px_-4px_rgba(245,158,11,0.45)]',
  gold: 'border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400',
  violet:
    'border border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-400',
  ghost:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400',
  danger:
    'border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-400',
}

const sizeClass = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-base rounded-xl',
}

export function Button({
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  disabled,
  ...rest
}: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={
        'inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ' +
        variantClass[variant] +
        ' ' +
        sizeClass[size] +
        ' ' +
        className
      }
    >
      {children}
    </button>
  )
}

/* ============ Tag：装备/灵宠品质标签 ============ */
export function Tag({
  quality = 'info',
  children,
  onClose,
  onClick,
  className = '',
}: {
  quality?: Quality
  children: ReactNode
  onClose?: () => void
  onClick?: () => void
  className?: string
}) {
  return (
    <span
      onClick={onClick}
      className={
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium cursor-default transition-colors ' +
        qualityClass[quality] +
        (onClick ? ' cursor-pointer hover:brightness-105' : '') +
        ' ' +
        className
      }
    >
      {children}
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-slate-300/50"
          aria-label="关闭"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  )
}

/* ============ Stat：属性条 ============ */
export function Stat({
  label,
  value,
  highlight = false,
  onAdd,
}: {
  label: string
  value: string | number
  highlight?: boolean
  onAdd?: () => void
}) {
  return (
    <div
      className={
        'flex items-center justify-between rounded-lg border px-3 py-2 text-xs ' +
        (highlight
          ? 'border-blue-300 bg-blue-50'
          : 'border-slate-200 bg-slate-50/80')
      }
    >
      <span className="text-slate-600">{label}</span>
      <span className="flex items-center gap-1 font-mono text-slate-900">
        {value}
        {onAdd && (
          <button
            onClick={onAdd}
            className="rounded-full bg-blue-500/20 px-1.5 text-xs text-blue-700 hover:bg-blue-500/40"
            aria-label={`提升${label}`}
          >
            +
          </button>
        )}
      </span>
    </div>
  )
}

/* ============ ProgressBar：进度条 ============ */
export function ProgressBar({
  value,
  max,
  label,
  color = 'amber',
}: {
  value: number
  max: number
  label?: string
  color?: 'amber' | 'rose' | 'emerald' | 'violet'
}) {
  const pct = Math.min(100, max <= 0 ? 0 : (value / max) * 100)
  const colorClass = {
    amber: 'from-blue-500 to-sky-400',
    rose: 'from-rose-500 to-pink-400',
    emerald: 'from-emerald-500 to-teal-400',
    violet: 'from-violet-500 to-purple-400',
  }[color]
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex justify-between text-xs text-slate-600">
          <span>{label}</span>
          <span className="font-mono">{pct.toFixed(2)}%</span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className={'h-full rounded-full bg-gradient-to-r ' + colorClass}
          initial={{ width: 0 }}
          animate={{ width: pct + '%' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

/* ============ Modal：弹窗（替代 ElMessageBox） ============ */
export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-slate-700">{children}</div>
            {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ============ Notification：浮动通知（替代 gameNotifys） ============ */
export function NotificationHost({
  notification,
  onDismiss,
}: {
  notification: { title: string; message: string; id: number } | null
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [notification, onDismiss])

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto w-72 rounded-xl border border-blue-300 bg-white p-3 shadow-[0_8px_30px_-8px_rgba(245,158,11,0.30)]"
            onClick={onDismiss}
          >
            <div className="text-sm font-bold text-blue-700">{notification.title}</div>
            <div
              className="mt-1 text-xs text-slate-700"
              dangerouslySetInnerHTML={{ __html: notification.message }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============ ConfirmDialog：确认框 ============ */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  danger = false,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      {typeof message === 'string' ? (
        <div dangerouslySetInnerHTML={{ __html: message }} />
      ) : (
        <div>{message}</div>
      )}
    </Modal>
  )
}

/* ============ useConfirm：便捷确认 hook ============ */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    message: ReactNode
    onConfirm?: () => void
    danger?: boolean
  }>({ open: false, title: '', message: '' })

  const confirm = (
    title: string,
    message: ReactNode,
    onConfirm: () => void,
    danger = false,
  ) => {
    setState({ open: true, title, message, onConfirm, danger })
  }

  const close = () => setState((s) => ({ ...s, open: false }))

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      danger={state.danger}
      onCancel={close}
      onConfirm={() => {
        state.onConfirm?.()
        close()
      }}
    />
  )

  return { confirm, dialog }
}

/* ============ ScrollableLog：战斗日志滚动容器 ============ */
export function ScrollableLog({
  texts,
  className = '',
}: {
  texts: string[]
  className?: string
}) {
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (scrollRef) {
      scrollRef.scrollTop = scrollRef.scrollHeight
    }
  }, [texts, scrollRef])

  return (
    <div
      ref={setScrollRef}
      className={
        'h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-sm leading-relaxed ' +
        className
      }
    >
      {texts.length === 0 ? (
        <p className="text-slate-500">日志将显示在这里…</p>
      ) : (
        texts.map((t, i) => (
          <p
            key={i}
            className="mb-1 text-slate-700"
            dangerouslySetInnerHTML={{ __html: t }}
          />
        ))
      )}
    </div>
  )
}

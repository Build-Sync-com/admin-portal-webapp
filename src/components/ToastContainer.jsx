import { createPortal } from 'react-dom'
import { AlertCircleIcon, CheckCircleIcon, InfoCircleIcon, XIcon } from './icons'

const TOAST_STYLES = {
  success: {
    container: 'border-emerald-200 bg-emerald-50',
    icon: 'text-emerald-600',
    Icon: CheckCircleIcon,
  },
  error: {
    container: 'border-red-200 bg-red-50',
    icon: 'text-red-600',
    Icon: AlertCircleIcon,
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-600',
    Icon: InfoCircleIcon,
  },
}

export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type] ?? TOAST_STYLES.info
        const { Icon } = style
        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${style.container}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} />
            <p className="flex-1 text-sm font-medium text-slate-800">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 text-slate-400 transition hover:text-slate-600"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}

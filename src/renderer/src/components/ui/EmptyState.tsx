import type { ReactNode } from 'react'

export function EmptyState({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <div className="text-faint">{icon}</div>
      <p className="text-sm font-medium text-fg-2">{title}</p>
      {hint && <p className="max-w-64 text-xs text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

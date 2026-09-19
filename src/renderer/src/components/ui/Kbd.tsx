import type { ReactNode } from 'react'

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line-strong bg-app px-1.5 py-0.5 font-mono text-2xs text-fg-2">{children}</kbd>
  )
}

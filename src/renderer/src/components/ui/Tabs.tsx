import type { ReactNode } from 'react'

interface Tab<T extends string> {
  id: T
  label: string
  icon?: ReactNode
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[]
  value: T | null
  onChange: (id: T) => void
  variant?: 'underline' | 'segmented'
  className?: string
}

export function Tabs<T extends string>({ tabs, value, onChange, variant = 'underline', className = '' }: TabsProps<T>) {
  const segmented = variant === 'segmented'
  return (
    <div role="tablist" className={`flex ${segmented ? 'gap-0.5 rounded-md bg-app p-0.5' : 'border-b border-line'} ${className}`}>
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap text-xs font-medium cursor-pointer transition-colors duration-150 ${
              segmented
                ? `h-7 rounded px-2.5 ${active ? 'bg-raised text-fg shadow-sm' : 'text-muted hover:text-fg'}`
                : `h-9 px-2 border-b-2 -mb-px ${active ? 'border-select text-fg' : 'border-transparent text-muted hover:text-fg'}`
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

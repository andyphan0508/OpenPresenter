import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string // accessible name + tooltip (icon-only buttons must have one)
  icon: ReactNode
  active?: boolean
  tone?: 'default' | 'danger'
  size?: 'sm' | 'md'
}

export function IconButton({ label, icon, active, tone = 'default', size = 'md', className = '', ...rest }: IconButtonProps) {
  const dim = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'
  const color = active
    ? 'bg-select/15 text-select'
    : tone === 'danger'
      ? 'text-fg-2 hover:bg-danger hover:text-white'
      : 'text-fg-2 hover:bg-raised hover:text-fg'
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`inline-flex items-center justify-center rounded-md cursor-pointer transition-colors duration-150
        disabled:opacity-30 disabled:cursor-not-allowed ${dim} ${color} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  )
}

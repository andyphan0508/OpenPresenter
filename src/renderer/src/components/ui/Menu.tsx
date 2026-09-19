import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface MenuItem {
  label: string
  icon?: ReactNode
  onSelect: () => void
}

// Button that opens a small dropdown list; closes on selection, outside click or Escape.
export function Menu({ trigger, items, align = 'left' }: { trigger: (open: () => void) => ReactNode; items: MenuItem[]; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger(() => setOpen((o) => !o))}
      {open && (
        <ul
          role="menu"
          className={`absolute z-40 mt-1 min-w-52 rounded-lg border border-line-strong bg-panel p-1 shadow-xl ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-fg-2 cursor-pointer hover:bg-raised hover:text-fg"
              >
                <span className="text-muted">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

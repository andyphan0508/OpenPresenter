import { useId, type ReactNode } from 'react'

interface FieldProps {
  label: string
  hint?: string
  children: (id: string) => ReactNode
  className?: string
}

// Visible label bound to its control, optional helper text below.
export function Field({ label, hint, children, className = '' }: FieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-2xs text-muted">{hint}</p>}
    </div>
  )
}

interface ColorInputProps {
  value: string
  onChange: (value: string) => void
  id?: string
}

export function ColorInput({ value, onChange, id }: ColorInputProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="Chọn màu"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded border border-line-strong bg-transparent"
      />
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input font-mono" />
    </div>
  )
}

interface RangeInputProps {
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  id?: string
}

export function RangeInput({ value, min, max, step = 1, unit = '', onChange, id }: RangeInputProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="flex-1 accent-select"
      />
      <span className="w-14 text-right font-mono text-xs text-fg-2">
        {Number.isInteger(step) ? value : value.toFixed(2)}
        {unit}
      </span>
    </div>
  )
}

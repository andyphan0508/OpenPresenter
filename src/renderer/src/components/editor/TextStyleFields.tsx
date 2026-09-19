import { TextAlignCenter, TextAlignLeft, TextAlignRight, TextB, TextItalic } from '@phosphor-icons/react'
import type { Box, TextStyle } from '../../types'
import { ColorInput, Field, RangeInput } from '../ui/Field'
import { IconButton } from '../ui/IconButton'

export const FONT_OPTIONS = [
  'sans-serif', 'serif', 'Arial', 'Helvetica Neue', 'Georgia', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Tahoma', 'Impact'
]

// Shared by the slide text inspector and the theme editor.
export function TextStyleFields({ style, onChange }: { style: TextStyle; onChange: (u: Partial<TextStyle>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Phông chữ">
        {(id) => (
          <select id={id} value={style.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value })} className="input" style={{ fontFamily: style.fontFamily }}>
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Cỡ chữ">{(id) => <RangeInput id={id} min={16} max={200} value={style.fontSize} unit="px" onChange={(fontSize) => onChange({ fontSize })} />}</Field>
      <Field label="Màu chữ">{(id) => <ColorInput id={id} value={style.color} onChange={(color) => onChange({ color })} />}</Field>

      <div className="flex items-center gap-1">
        <IconButton label="In đậm" active={style.fontWeight === 'bold'} icon={<TextB size={16} weight="bold" />} onClick={() => onChange({ fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' })} />
        <IconButton label="In nghiêng" active={style.fontStyle === 'italic'} icon={<TextItalic size={16} />} onClick={() => onChange({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })} />
        <span className="mx-1 h-5 w-px bg-line" />
        <IconButton label="Căn trái" active={style.textAlign === 'left'} icon={<TextAlignLeft size={16} />} onClick={() => onChange({ textAlign: 'left' })} />
        <IconButton label="Căn giữa" active={style.textAlign === 'center'} icon={<TextAlignCenter size={16} />} onClick={() => onChange({ textAlign: 'center' })} />
        <IconButton label="Căn phải" active={style.textAlign === 'right'} icon={<TextAlignRight size={16} />} onClick={() => onChange({ textAlign: 'right' })} />
        <span className="mx-1 h-5 w-px bg-line" />
        <select
          aria-label="Chữ hoa / thường"
          value={style.textTransform}
          onChange={(e) => onChange({ textTransform: e.target.value as TextStyle['textTransform'] })}
          className="input h-8 w-20 py-0"
        >
          <option value="none">Aa</option>
          <option value="uppercase">AA</option>
          <option value="lowercase">aa</option>
        </select>
      </div>

      <Field label="Giãn dòng">{(id) => <RangeInput id={id} min={0.8} max={2.5} step={0.05} value={style.lineHeight} onChange={(lineHeight) => onChange({ lineHeight })} />}</Field>

      <fieldset className="space-y-2">
        <label className="flex items-center gap-2 text-[13px] text-fg-2">
          <input type="checkbox" checked={style.textShadow} onChange={(e) => onChange({ textShadow: e.target.checked })} className="accent-select" />
          Đổ bóng
        </label>
        {style.textShadow && (
          <div className="space-y-2 pl-6">
            <ColorInput value={style.shadowColor} onChange={(shadowColor) => onChange({ shadowColor })} />
            <RangeInput min={0} max={40} value={style.shadowBlur} unit="px" onChange={(shadowBlur) => onChange({ shadowBlur })} />
          </div>
        )}
        <label className="flex items-center gap-2 text-[13px] text-fg-2">
          <input type="checkbox" checked={style.outline} onChange={(e) => onChange({ outline: e.target.checked })} className="accent-select" />
          Viền chữ
        </label>
        {style.outline && (
          <div className="space-y-2 pl-6">
            <ColorInput value={style.outlineColor} onChange={(outlineColor) => onChange({ outlineColor })} />
            <RangeInput min={1} max={10} value={style.outlineWidth} unit="px" onChange={(outlineWidth) => onChange({ outlineWidth })} />
          </div>
        )}
      </fieldset>
    </div>
  )
}

export function BoxFields({ box, onChange }: { box: Box; onChange: (u: Partial<Box>) => void }) {
  const LABELS: Record<keyof Box, string> = { x: 'Trái', y: 'Trên', width: 'Rộng', height: 'Cao' }
  return (
    <div>
      <span className="label">Vị trí & kích thước (%)</span>
      <div className="grid grid-cols-4 gap-1.5">
        {(Object.keys(LABELS) as (keyof Box)[]).map((k) => (
          <label key={k} className="text-2xs text-muted">
            {LABELS[k]}
            <input type="number" min={0} max={100} value={box[k]} onChange={(e) => onChange({ [k]: +e.target.value })} className="input mt-0.5 px-1.5" />
          </label>
        ))}
      </div>
    </div>
  )
}

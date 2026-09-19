import { useMemo, type ReactNode } from 'react'
import { useStore } from '../../store'
import type { Theme } from '../../types'
import { BackgroundFields } from '../editor/BackgroundFields'
import { BoxFields, TextStyleFields } from '../editor/TextStyleFields'
import { SlideView } from '../slides/SlideView'
import { Button } from '../ui/Button'
import { ColorInput, Field, RangeInput } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { sampleSlide } from '../../helpers/themeSample'

// Edits apply live to every slide linked to this theme.
export function ThemeEditorDialog({ themeId, onClose, footer }: { themeId: string; onClose: () => void; footer?: ReactNode }) {
  const themes = useStore((s) => s.themes)
  const updateTheme = useStore((s) => s.updateTheme)
  const theme = themes.find((t) => t.id === themeId)
  const sample = useMemo(() => sampleSlide(themeId), [themeId])
  if (!theme) return null
  const update = (u: Partial<Theme>) => updateTheme(theme.id, u)

  return (
    <Modal
      title={`Theme · ${theme.name}`}
      onClose={onClose}
      width="w-[980px]"
      footer={
        <>
          {footer}
          <Button variant="primary" onClick={onClose}>
            Xong
          </Button>
        </>
      }
    >
      <div className="flex gap-5">
        <div className="w-80 flex-shrink-0 space-y-4">
          <Field label="Tên theme">{(id) => <input id={id} value={theme.name} onChange={(e) => update({ name: e.target.value })} className="input" />}</Field>
          <div>
            <span className="label">Nền</span>
            <BackgroundFields bg={theme.background} onChange={(background) => update({ background })} />
          </div>
          <TextStyleFields style={theme.text} onChange={(u) => update({ text: { ...theme.text, ...u } })} />
          <BoxFields box={theme.box} onChange={(u) => update({ box: { ...theme.box, ...u } })} />
          <fieldset className="space-y-2">
            <span className="label">Lời dịch (song ngữ)</span>
            <ColorInput value={theme.translation.color} onChange={(color) => update({ translation: { ...theme.translation, color } })} />
            <RangeInput min={0.4} max={1} step={0.05} value={theme.translation.scale} onChange={(scale) => update({ translation: { ...theme.translation, scale } })} />
          </fieldset>
        </div>
        <div className="min-w-0 flex-1">
          <span className="label">Xem trước</span>
          <div className="sticky top-0 overflow-hidden rounded-lg ring-1 ring-line-strong">
            <SlideView slide={sample} themes={themes} play />
          </div>
        </div>
      </div>
    </Modal>
  )
}

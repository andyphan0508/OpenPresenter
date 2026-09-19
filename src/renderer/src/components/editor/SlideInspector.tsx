import { useStore } from '../../store'
import type { Slide } from '../../types'
import { Field } from '../ui/Field'
import { Tabs } from '../ui/Tabs'

export function SlideInspector({ presId, slide }: { presId: string; slide: Slide }) {
  const updateSlide = useStore((s) => s.updateSlide)
  return (
    <div className="space-y-4">
      <Field label="Nhãn slide" hint="Hiện trên thanh màu dưới ô slide và màn hình sân khấu.">
        {(id) => <input id={id} value={slide.label ?? ''} onChange={(e) => updateSlide(presId, slide.id, { label: e.target.value || undefined })} className="input" />}
      </Field>
      <div>
        <span className="label">Chuyển cảnh</span>
        <Tabs
          variant="segmented"
          value={slide.transition === 'slide' ? 'fade' : slide.transition}
          onChange={(transition) => updateSlide(presId, slide.id, { transition })}
          tabs={[
            { id: 'none', label: 'Cắt' },
            { id: 'fade', label: 'Mờ dần' }
          ]}
        />
      </div>
      <Field label="Ghi chú">
        {(id) => (
          <textarea id={id} rows={5} value={slide.notes} onChange={(e) => updateSlide(presId, slide.id, { notes: e.target.value })} placeholder="Ghi chú cho người điều khiển…" className="input resize-y" />
        )}
      </Field>
    </div>
  )
}

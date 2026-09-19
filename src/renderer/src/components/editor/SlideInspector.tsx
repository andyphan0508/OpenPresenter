import { useStore } from '../../store'
import type { Slide, SlideTransition } from '../../types'
import { Field } from '../ui/Field'
import { Tabs } from '../ui/Tabs'

const TRANSITIONS: { id: SlideTransition; label: string }[] = [
  { id: 'none', label: 'Cắt' },
  { id: 'fade', label: 'Mờ dần' },
  { id: 'slide', label: 'Đẩy' },
  { id: 'zoom', label: 'Phóng' }
]

export function SlideInspector({ presId, slide }: { presId: string; slide: Slide }) {
  const { updateSlide, setAllTransitions } = useStore.getState()
  return (
    <div className="space-y-4">
      <Field label="Nhãn slide" hint="Hiện trên thanh màu dưới ô slide và màn hình sân khấu.">
        {(id) => <input id={id} value={slide.label ?? ''} onChange={(e) => updateSlide(presId, slide.id, { label: e.target.value || undefined })} className="input" />}
      </Field>
      <div>
        <span className="label">Chuyển cảnh</span>
        <Tabs
          variant="segmented"
          value={slide.transition}
          onChange={(transition) => updateSlide(presId, slide.id, { transition })}
          tabs={TRANSITIONS}
        />
        <button type="button" onClick={() => setAllTransitions(presId, slide.transition)} className="mt-1.5 cursor-pointer text-2xs text-select hover:underline">
          Áp dụng cho mọi slide trong buổi nhóm
        </button>
      </div>
      <Field label="Ghi chú">
        {(id) => (
          <textarea id={id} rows={5} value={slide.notes} onChange={(e) => updateSlide(presId, slide.id, { notes: e.target.value })} placeholder="Ghi chú cho người điều khiển…" className="input resize-y" />
        )}
      </Field>
    </div>
  )
}

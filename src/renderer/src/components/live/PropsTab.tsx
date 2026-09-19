import { Plus, Stack, Trash } from '@phosphor-icons/react'
import { mediaUrl, pickMediaFiles } from '../../api/media'
import { useStore } from '../../store'
import type { PropPosition } from '../../types'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { RangeInput } from '../ui/Field'
import { IconButton } from '../ui/IconButton'

const POSITIONS: { id: PropPosition; label: string }[] = [
  { id: 'top-left', label: 'Trên trái' },
  { id: 'top-right', label: 'Trên phải' },
  { id: 'bottom-left', label: 'Dưới trái' },
  { id: 'bottom-right', label: 'Dưới phải' },
  { id: 'center', label: 'Giữa' }
]

// Props: images (church logo, watermark) that stay on screen independent of slides.
export function PropsTab() {
  const props = useStore((s) => s.props)
  const activeIds = useStore((s) => s.activePropIds)
  const { addProp, updateProp, deleteProp, toggleProp } = useStore.getState()

  const add = async () => {
    for (const f of await pickMediaFiles(true)) addProp({ name: f.name, mediaPath: f.path, position: 'top-right', size: 12 })
  }

  return (
    <div className="space-y-2 p-3">
      {props.length === 0 && <EmptyState icon={<Stack size={28} />} title="Chưa có prop" hint="Ví dụ: logo Hội Thánh ở góc màn hình." />}
      {props.map((p) => {
        const on = activeIds.includes(p.id)
        return (
          <div key={p.id} className={`space-y-2 rounded-md border p-2.5 ${on ? 'border-live bg-live/10' : 'border-line bg-surface'}`}>
            <div className="flex items-center gap-2">
              <img src={mediaUrl(p.mediaPath)} alt="" className="h-9 w-14 rounded bg-black object-contain" />
              <input aria-label="Tên prop" value={p.name} onChange={(e) => updateProp(p.id, { name: e.target.value })} className="input h-7 py-0" />
              <IconButton size="sm" tone="danger" label="Xóa prop" icon={<Trash size={13} />} onClick={() => deleteProp(p.id)} />
            </div>
            <select aria-label="Vị trí" value={p.position} onChange={(e) => updateProp(p.id, { position: e.target.value as PropPosition })} className="input h-7 py-0 text-xs">
              {POSITIONS.map((pos) => (
                <option key={pos.id} value={pos.id}>{pos.label}</option>
              ))}
            </select>
            <RangeInput min={3} max={60} value={p.size} unit="%" onChange={(size) => updateProp(p.id, { size })} />
            <Button size="sm" variant={on ? 'live' : 'secondary'} className="w-full" onClick={() => toggleProp(p.id)}>
              {on ? 'Đang hiện — bấm để ẩn' : 'Hiện prop'}
            </Button>
          </div>
        )
      })}
      <Button size="sm" variant="ghost" icon={<Plus size={13} />} onClick={add}>
        Thêm prop (ảnh)
      </Button>
    </div>
  )
}

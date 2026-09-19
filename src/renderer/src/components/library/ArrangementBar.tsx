import { CaretLeft, Plus, Trash, X } from '@phosphor-icons/react'
import { v4 as uuidv4 } from 'uuid'
import { sectionColor } from '../../constants/sections'
import { orderedSections } from '../../helpers/arrangement'
import type { Song, SongArrangement } from '../../types'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'

interface ArrangementBarProps {
  song: Song
  onChange: (updates: Partial<Song>) => void
}

// Pick / edit the sing order (ProPresenter "arrangements"). Order references sections by label.
export function ArrangementBar({ song, onChange }: ArrangementBarProps) {
  const arrangements = song.arrangements ?? []
  const active = arrangements.find((a) => a.id === song.activeArrangementId)
  const labels = [...new Set(song.slides.map((s) => s.sectionLabel))]
  const typeOf = (label: string) => song.slides.find((s) => s.sectionLabel.toLowerCase() === label.toLowerCase())?.sectionType

  const updateActive = (changes: Partial<SongArrangement>) =>
    onChange({ arrangements: arrangements.map((a) => (a.id === active?.id ? { ...a, ...changes } : a)) })

  const create = () => {
    const arr = { id: uuidv4(), name: `Thứ tự ${arrangements.length + 1}`, order: orderedSections(song).map((s) => s.sectionLabel) }
    onChange({ arrangements: [...arrangements, arr], activeArrangementId: arr.id })
  }

  const remove = () => {
    if (active && confirm(`Xóa thứ tự "${active.name}"?`)) {
      onChange({ arrangements: arrangements.filter((a) => a.id !== active.id), activeArrangementId: undefined })
    }
  }

  const move = (i: number) => {
    if (!active || i === 0) return
    const order = [...active.order]
    ;[order[i - 1], order[i]] = [order[i], order[i - 1]]
    updateActive({ order })
  }

  return (
    <div className="space-y-2 border-b border-line bg-panel px-4 py-2.5">
      <div className="flex items-center gap-2">
        <label htmlFor="arrangement" className="panel-title">
          Thứ tự hát
        </label>
        <select
          id="arrangement"
          value={active?.id ?? ''}
          onChange={(e) => onChange({ activeArrangementId: e.target.value || undefined })}
          className="input h-7 w-auto py-0"
        >
          <option value="">Theo bài (tất cả đoạn)</option>
          {arrangements.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {active && (
          <input
            aria-label="Tên thứ tự"
            value={active.name}
            onChange={(e) => updateActive({ name: e.target.value })}
            className="input h-7 w-36 py-0"
          />
        )}
        <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={create}>
          Tạo thứ tự
        </Button>
        {active && <IconButton size="sm" tone="danger" label="Xóa thứ tự này" icon={<Trash size={13} />} onClick={remove} />}
      </div>

      {active && (
        <div className="flex flex-wrap items-center gap-1">
          {active.order.map((label, i) => {
            const type = typeOf(label)
            return (
              <span
                key={i}
                className={`flex h-6 items-center gap-1 rounded-md pl-2 pr-0.5 text-xs font-medium text-white ${type ? '' : 'opacity-50 line-through'}`}
                style={{ backgroundColor: type ? sectionColor(type) : '#6b7280' }}
                title={type ? label : 'Bài hát không có đoạn này'}
              >
                {label}
                {i > 0 && (
                  <button type="button" aria-label={`Đưa ${label} lên trước`} onClick={() => move(i)} className="rounded p-0.5 cursor-pointer hover:bg-black/25">
                    <CaretLeft size={11} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Bỏ ${label}`}
                  onClick={() => updateActive({ order: active.order.filter((_, j) => j !== i) })}
                  className="rounded p-0.5 cursor-pointer hover:bg-black/25"
                >
                  <X size={11} />
                </button>
              </span>
            )
          })}
          <span className="mx-1 text-2xs text-muted">thêm:</span>
          {labels.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => updateActive({ order: [...active.order, label] })}
              className="h-6 rounded-md border border-dashed border-line-strong px-2 text-xs text-fg-2 cursor-pointer hover:border-select hover:text-fg"
            >
              + {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

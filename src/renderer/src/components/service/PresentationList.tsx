import { CalendarBlank, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { useStore } from '../../store'
import { IconButton } from '../ui/IconButton'

function NameInput({ initial, onDone }: { initial: string; onDone: (name: string | null) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <input
      autoFocus
      value={value}
      aria-label="Tên chương trình"
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onDone(value.trim() || null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onDone(value.trim() || null)
        if (e.key === 'Escape') onDone(null)
      }}
      className="input h-7 py-0"
    />
  )
}

// Services (ProPresenter "playlists"): create, pick, rename, delete.
export function PresentationList() {
  const presentations = useStore((s) => s.presentations)
  const currentId = useStore((s) => s.currentPresentationId)
  const { createPresentation, setCurrentPresentation, renamePresentation, deletePresentation } = useStore.getState()
  const [creating, setCreating] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)

  const defaultName = () => `Chúa Nhật ${new Date().toLocaleDateString('vi-VN')}`

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 pb-1 pt-2">
        <h3 className="panel-title">Buổi nhóm</h3>
        <IconButton size="sm" label="Tạo chương trình mới" icon={<Plus size={14} />} onClick={() => setCreating(true)} />
      </div>
      <ul className="max-h-44 overflow-y-auto px-1.5 pb-2">
        {creating && (
          <li className="px-1.5 py-1">
            <NameInput
              initial={defaultName()}
              onDone={(name) => {
                if (name) createPresentation(name)
                setCreating(false)
              }}
            />
          </li>
        )}
        {presentations.length === 0 && !creating && (
          <li>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="m-1.5 w-[calc(100%-12px)] rounded-md border border-dashed border-line-strong px-3 py-3 text-xs text-muted cursor-pointer hover:border-select hover:text-fg"
            >
              + Tạo chương trình đầu tiên
            </button>
          </li>
        )}
        {presentations.map((p) => (
          <li key={p.id} className="group">
            {renamingId === p.id ? (
              <div className="px-1.5 py-1">
                <NameInput
                  initial={p.name}
                  onDone={(name) => {
                    if (name) renamePresentation(p.id, name)
                    setRenamingId(null)
                  }}
                />
              </div>
            ) : (
              <div
                className={`flex h-8 items-center gap-2 rounded-md px-2 text-[13px] ${
                  p.id === currentId ? 'bg-select/15 text-fg' : 'text-fg-2 hover:bg-raised'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCurrentPresentation(p.id)}
                  onDoubleClick={() => setRenamingId(p.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
                >
                  <CalendarBlank size={14} className="flex-shrink-0 text-muted" />
                  <span className="truncate">{p.name}</span>
                </button>
                <span className="text-2xs text-muted group-hover:hidden">{p.slides.length}</span>
                <span className="hidden gap-0.5 group-hover:flex">
                  <IconButton size="sm" label="Đổi tên" icon={<PencilSimple size={12} />} onClick={() => setRenamingId(p.id)} />
                  <IconButton
                    size="sm"
                    tone="danger"
                    label="Xóa chương trình"
                    icon={<Trash size={12} />}
                    onClick={() => confirm(`Xóa "${p.name}"? Không thể hoàn tác.`) && deletePresentation(p.id)}
                  />
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

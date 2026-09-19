import { Plus, Trash } from '@phosphor-icons/react'
import { useStore } from '../../store'
import type { Message } from '../../types'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'

const TARGETS: { id: Message['target']; label: string }[] = [
  { id: 'audience', label: 'Khán phòng' },
  { id: 'stage', label: 'Sân khấu' },
  { id: 'both', label: 'Cả hai' }
]

// Messages: text overlays for the audience and/or stage. "{timer}" shows a linked timer.
export function MessagesTab() {
  const messages = useStore((s) => s.messages)
  const timers = useStore((s) => s.timers)
  const activeId = useStore((s) => s.activeMessageId)
  const { addMessage, updateMessage, deleteMessage, setActiveMessage } = useStore.getState()

  return (
    <div className="space-y-2 p-3">
      <p className="text-2xs text-muted">
        Gõ <code className="rounded bg-surface px-1 text-fg">{'{timer}'}</code> để chèn đồng hồ đếm ngược, ví dụ “Buổi nhóm bắt đầu sau {'{timer}'}”.
      </p>
      {messages.map((m) => {
        const live = m.id === activeId
        return (
          <div key={m.id} className={`space-y-2 rounded-md border p-2.5 ${live ? 'border-live bg-live/10' : 'border-line bg-surface'}`}>
            <textarea aria-label="Nội dung tin nhắn" rows={2} value={m.text} onChange={(e) => updateMessage(m.id, { text: e.target.value })} className="input resize-none" />
            <div className="flex items-center gap-1.5">
              <select aria-label="Hiện ở" value={m.target} onChange={(e) => updateMessage(m.id, { target: e.target.value as Message['target'] })} className="input h-7 flex-1 py-0 text-xs">
                {TARGETS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <select aria-label="Gắn hẹn giờ" value={m.timerId ?? ''} onChange={(e) => updateMessage(m.id, { timerId: e.target.value || undefined })} className="input h-7 flex-1 py-0 text-xs">
                <option value="">Không hẹn giờ</option>
                {timers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <IconButton size="sm" tone="danger" label="Xóa tin nhắn" icon={<Trash size={13} />} onClick={() => deleteMessage(m.id)} />
            </div>
            <Button size="sm" variant={live ? 'live' : 'secondary'} className="w-full" onClick={() => setActiveMessage(live ? null : m.id)}>
              {live ? 'Đang hiện — bấm để ẩn (F5)' : 'Hiện tin nhắn'}
            </Button>
          </div>
        )
      })}
      <Button size="sm" variant="ghost" icon={<Plus size={13} />} onClick={addMessage}>
        Thêm tin nhắn
      </Button>
    </div>
  )
}

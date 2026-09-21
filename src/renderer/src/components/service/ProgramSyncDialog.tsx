import { BookOpenText, CheckCircle, CloudArrowDown, MusicNotes, Plus, TextT, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { fetchProgram, loadPassage } from '../../api/program'
import { programName, resolveItem, type Program, type ResolvedItem } from '../../helpers/program'
import { useStore } from '../../store'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Modal } from '../ui/Modal'

const KIND_ICON = {
  song: <MusicNotes size={14} />,
  bible: <BookOpenText size={14} />,
  text: <TextT size={14} />
}

const STATUS = {
  ok: { icon: <CheckCircle size={14} weight="fill" className="text-green-600" />, text: '' },
  'new-song': { icon: <Plus size={14} className="text-select" />, text: 'Bài mới — thêm vào thư viện từ lời trên dashboard' },
  missing: { icon: <Warning size={14} weight="fill" className="text-amber-500" />, text: 'Chưa tìm thấy — tạo slide tạm, sửa lại sau' }
}

// Weekly program from the dashboard → a ready-made service; syncing again merges without losing local edits.
export function ProgramSyncDialog({ onClose }: { onClose: () => void }) {
  const savedUrl = useStore((s) => s.settings.programApiUrl)
  const presentations = useStore((s) => s.presentations)
  const { updateSettings, applyProgram } = useStore.getState()
  const [url, setUrl] = useState(savedUrl)
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState<{ program: Program; resolved: ResolvedItem[] } | null>(null)

  const load = async () => {
    setBusy(true)
    setError('')
    setLoaded(null)
    try {
      updateSettings({ programApiUrl: url.trim() })
      const program = await fetchProgram(url.trim(), date || undefined)
      const { songs, settings } = useStore.getState()
      const resolved = await Promise.all(
        program.items.map((item) => resolveItem(item, songs, (ref) => loadPassage(ref, settings.bibleSecondary)))
      )
      setLoaded({ program, resolved })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const existing = loaded && presentations.find((p) => p.program?.id === loaded.program.id)
  const upToDate = existing && existing.program?.updatedAt === loaded?.program.updatedAt

  const apply = () => {
    if (!loaded) return
    applyProgram(loaded.program, loaded.resolved)
    onClose()
  }

  return (
    <Modal
      title="Chương trình tuần"
      onClose={onClose}
      width="w-[640px]"
      footer={
        loaded && (
          <Button variant="primary" onClick={apply}>
            {existing ? `Cập nhật “${existing.name}”` : 'Tạo buổi nhóm'}
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <Field label="Địa chỉ API chương trình" hint="Ví dụ: https://<web-ban>.vercel.app/api/program">
          {(id) => <input id={id} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/api/program" className="input" />}
        </Field>
        <div className="flex items-end gap-2">
          <Field label="Ngày" hint="Để trống: chương trình gần nhất sắp tới" className="flex-1">
            {(id) => <input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />}
          </Field>
          <Button variant="primary" icon={<CloudArrowDown size={15} />} disabled={!url.trim() || busy} onClick={load} className="mb-5">
            {busy ? 'Đang tải…' : 'Tải chương trình'}
          </Button>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[13px] text-danger">
            {error}
          </p>
        )}

        {loaded && (
          <div className="space-y-2">
            <p className="text-[13px] font-semibold text-fg">
              {programName(loaded.program)} · {loaded.program.date.split('-').reverse().join('/')}
            </p>
            <ol className="divide-y divide-line rounded-md border border-line">
              {loaded.resolved.map((r, i) => (
                <li key={r.item.id} className="flex items-start gap-2.5 px-3 py-2 text-[13px]">
                  <span className="w-4 text-right text-2xs text-muted">{i + 1}</span>
                  <span className="mt-0.5 text-muted">{KIND_ICON[r.kind]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-fg">{r.title}</span>
                    {r.item.kind === 'song' && r.item.label && <span className="block text-2xs text-muted">{r.item.label}</span>}
                    {STATUS[r.status].text && <span className="block text-2xs text-muted">{STATUS[r.status].text}</span>}
                  </span>
                  <span className="text-2xs text-muted">{r.slides.length} slide</span>
                  <span className="mt-0.5">{STATUS[r.status].icon}</span>
                </li>
              ))}
            </ol>
            {existing && (
              <p className="text-2xs leading-relaxed text-muted">
                {upToDate ? 'Buổi nhóm này đã khớp bản mới nhất. ' : 'Dashboard đã có thay đổi. '}
                Khi cập nhật: mục không đổi giữ nguyên slide bạn đã sửa, mục bạn tự thêm vẫn nằm đúng chỗ.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

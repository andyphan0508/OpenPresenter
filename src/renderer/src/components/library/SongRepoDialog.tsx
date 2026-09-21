import { BookOpen, CloudArrowDown, DownloadSimple, UploadSimple } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { FILTERS, openTextFiles, saveTextFile } from '../../api/files'
import { fetchSongIndex } from '../../api/songRepo'
import { THANHCA_ESTIMATE, crawlThanhca } from '../../api/thanhca'
import { exportSongIndex, mergeSongIndex, parseSongIndex, type SongIndex } from '../../helpers/songRepo'
import { useStore } from '../../store'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Shared song repository: pull from a URL / JSON file, export the library in the same format.
export function SongRepoDialog({ onClose }: { onClose: () => void }) {
  const savedUrl = useStore((s) => s.settings.songRepoUrl)
  const songs = useStore((s) => s.songs)
  const { updateSettings, applySongMerge } = useStore.getState()
  const [url, setUrl] = useState(savedUrl)
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState<{ ok: boolean; text: string } | null>(null)
  const [crawl, setCrawl] = useState<{ checked: number; found: number } | null>(null)
  const cancelled = useRef(false)
  useEffect(() => () => void (cancelled.current = true), []) // closing the dialog stops the crawl

  const merge = (index: SongIndex) => {
    const at = new Date().toISOString()
    const result = mergeSongIndex(useStore.getState().songs, index, at)
    applySongMerge(result, at)
    const skipped = result.skippedEdited.length
      ? ` Giữ nguyên ${result.skippedEdited.length} bài bạn đã sửa: ${result.skippedEdited.slice(0, 5).join(', ')}${result.skippedEdited.length > 5 ? '…' : ''}.`
      : ''
    setReport({
      ok: true,
      text: `${index.name ? `“${index.name}”: ` : ''}thêm ${result.toAdd.length}, cập nhật ${result.toUpdate.length}, không đổi ${result.unchanged}.${skipped}`
    })
  }

  const run = async (task: () => Promise<void>) => {
    setBusy(true)
    setReport(null)
    try {
      await task()
    } catch (e) {
      setReport({ ok: false, text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const syncFromUrl = () =>
    run(async () => {
      updateSettings({ songRepoUrl: url.trim() })
      merge(await fetchSongIndex(url.trim()))
    })

  // Pull the official hymnal straight from HTTLVN into the library; re-running updates it, local edits are kept.
  const syncThanhca = () =>
    run(async () => {
      cancelled.current = false
      setCrawl({ checked: 0, found: 0 })
      try {
        const index = await crawlThanhca((checked, found) => setCrawl({ checked, found }), () => cancelled.current)
        if (index.songs.length) merge(index)
      } finally {
        setCrawl(null)
      }
    })

  const importFile = () =>
    run(async () => {
      const [file] = await openTextFiles(FILTERS.songIndex)
      if (file) merge(parseSongIndex(file.content))
    })

  const exportFile = () =>
    run(async () => {
      const path = await saveTextFile('kho-bai-hat.json', exportSongIndex(songs, 'Thư viện OpenPresenter'), FILTERS.songIndex)
      if (path) setReport({ ok: true, text: `Đã xuất ${songs.length} bài ra ${path}` })
    })

  return (
    <Modal title="Kho bài hát" onClose={onClose} width="w-[600px]">
      <div className="space-y-5">
        <p className="text-[13px] leading-relaxed text-fg-2">
          Kho bài hát là một file JSON (ví dụ trên GitHub) chứa lời chuẩn đã được kiểm duyệt. Đồng bộ sẽ thêm bài mới và cập nhật bài
          cũ — <strong className="text-fg">bài bạn đã tự sửa sẽ không bị ghi đè</strong>.
        </p>

        <Field label="Địa chỉ kho (URL)" hint="Ví dụ: https://raw.githubusercontent.com/<tổ-chức>/<kho>/main/index.json">
          {(id) => (
            <div className="flex gap-2">
              <input id={id} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/index.json" className="input" />
              <Button variant="primary" icon={<CloudArrowDown size={15} />} disabled={!url.trim() || busy} onClick={syncFromUrl}>
                {busy ? 'Đang tải…' : 'Đồng bộ'}
              </Button>
            </div>
          )}
        </Field>

        <div className="space-y-2 rounded-md border border-line p-3">
          <p className="text-[13px] leading-relaxed text-fg-2">
            <strong className="text-fg">Thánh Ca HTTLVN</strong> — tải lời toàn bộ Thánh Ca (khoảng {THANHCA_ESTIMATE} bài) từ{' '}
            <span className="text-fg">thanhca.httlvn.org</span> vào thư viện, gắn số bài để chương trình tuần tự tìm đúng bài.
            Mất vài phút; lần sau chỉ cập nhật bài thay đổi.
          </p>
          {crawl ? (
            <div className="flex items-center gap-3">
              <progress className="h-2 flex-1" max={THANHCA_ESTIMATE} value={Math.min(crawl.checked, THANHCA_ESTIMATE)} aria-label="Tiến độ tải Thánh Ca" />
              <span className="text-2xs text-muted">{crawl.found} bài</span>
              <Button size="sm" onClick={() => (cancelled.current = true)}>Dừng</Button>
            </div>
          ) : (
            <Button icon={<BookOpen size={15} />} disabled={busy} onClick={syncThanhca}>
              Tải Thánh Ca từ HTTLVN
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button icon={<UploadSimple size={15} />} disabled={busy} onClick={importFile}>
            Nhập từ file JSON…
          </Button>
          <Button icon={<DownloadSimple size={15} />} disabled={busy} onClick={exportFile}>
            Xuất thư viện ra JSON…
          </Button>
        </div>

        {report && (
          <p role="status" className={`rounded-md border px-3 py-2 text-[13px] ${report.ok ? 'border-green-600/40 bg-green-600/10 text-fg' : 'border-danger/40 bg-danger/10 text-danger'}`}>
            {report.text}
          </p>
        )}
      </div>
    </Modal>
  )
}

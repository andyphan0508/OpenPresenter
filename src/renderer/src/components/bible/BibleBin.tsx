import { MagnifyingGlass, Play, Plus } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { BIBLE_VERSION_LABEL, getChapter, getChapterCounts } from '../../api/bible'
import { BOOKS } from '../../constants/bibleBooks'
import { bookName, parseRef } from '../../helpers/bibleRef'
import { useStore } from '../../store'
import { Button } from '../ui/Button'

// Kinh Thánh Truyền Thống 1925 (public domain), optional KJV line under each verse.
export function BibleBin() {
  const currentPresentationId = useStore((s) => s.currentPresentationId)
  const secondary = useStore((s) => s.settings.bibleSecondary)
  const bibleThemeId = useStore((s) => s.settings.bibleThemeId)
  const { addSlideGroup, goLive, updateSettings } = useStore.getState()

  const [counts, setCounts] = useState<Record<string, number>>({})
  const [book, setBook] = useState('JOH')
  const [chapter, setChapter] = useState(3)
  const [verses, setVerses] = useState<string[]>([])
  const [english, setEnglish] = useState<string[]>([])
  const [range, setRange] = useState<[number, number] | null>([16, 16])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [jump, setJump] = useState(0) // bumped on lookup → scroll to the verse

  useEffect(() => {
    getChapterCounts().then(setCounts)
  }, [])

  useEffect(() => {
    getChapter('vi1925', book, chapter).then(setVerses)
    if (secondary) getChapter(secondary, book, chapter).then(setEnglish)
  }, [book, chapter, secondary])

  useEffect(() => {
    if (range) document.getElementById(`verse-${range[0]}`)?.scrollIntoView({ block: 'center' })
  }, [verses, jump])

  const name = bookName(book)
  const [from, to] = range ? [Math.min(...range), Math.max(...range)] : [0, -1]
  const title = range ? `${name} ${chapter}:${from}${to > from ? `-${to}` : ''}` : ''

  const lookup = () => {
    const ref = parseRef(query)
    if (!ref) return setError('Không hiểu tham chiếu. Ví dụ: Giăng 3:16-18, Thi 23, 1Gi 1:9')
    setError('')
    setBook(ref.book[0])
    setChapter(Math.min(ref.chapter, counts[ref.book[0]] ?? ref.chapter))
    setRange(ref.from ? [ref.from, ref.to ?? ref.from] : null)
    setJump((j) => j + 1)
  }

  const add = (live: boolean) => {
    if (!currentPresentationId || !range) return
    const items = verses.slice(from - 1, to).map((text, i) => {
      const label = `${name} ${chapter}:${from + i}`
      return { label, content: `${text}\n(${label})`, translation: secondary ? english[from - 1 + i] : undefined }
    })
    const first = addSlideGroup(currentPresentationId, title, 'bible', items, bibleThemeId)
    if (live && first) goLive(first)
  }

  return (
    <div className="flex h-full">
      <div className="flex w-72 flex-shrink-0 flex-col gap-2.5 border-r border-line p-3">
        <div className="relative">
          <MagnifyingGlass size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookup()}
            placeholder="Giăng 3:16-18 · Thi 23 · 1Gi 1:9"
            aria-label="Tham chiếu Kinh Thánh"
            className="input pl-8"
          />
        </div>
        {error && <p role="alert" className="text-xs text-danger">{error}</p>}
        <div className="flex gap-1.5">
          <select aria-label="Sách" value={book} onChange={(e) => { setBook(e.target.value); setChapter(1); setRange(null) }} className="input">
            {BOOKS.map(([code, n]) => (
              <option key={code} value={code}>{n}</option>
            ))}
          </select>
          <select aria-label="Đoạn" value={chapter} onChange={(e) => { setChapter(+e.target.value); setRange(null) }} className="input w-24">
            {Array.from({ length: counts[book] ?? 1 }, (_, i) => (
              <option key={i} value={i + 1}>Đoạn {i + 1}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs text-fg-2">
          <input
            type="checkbox"
            checked={!!secondary}
            onChange={(e) => updateSettings({ bibleSecondary: e.target.checked ? 'kjv' : '' })}
            className="accent-select"
          />
          Song ngữ: thêm {BIBLE_VERSION_LABEL.kjv}
        </label>
        <div className="mt-auto space-y-1.5">
          <p className="truncate text-[13px] font-medium text-fg">{title || 'Chưa chọn câu'}</p>
          <p className="text-2xs text-muted">{range ? `${to - from + 1} câu · mỗi câu một slide` : 'Bấm chọn câu, Shift+bấm để chọn nhiều câu'}</p>
          <div className="flex gap-1.5">
            <Button size="sm" icon={<Plus size={13} />} disabled={!currentPresentationId || !range} onClick={() => add(false)} className="flex-1">
              Thêm
            </Button>
            <Button size="sm" variant="live" icon={<Play size={13} weight="fill" />} disabled={!currentPresentationId || !range} onClick={() => add(true)} className="flex-1">
              Thêm & chiếu
            </Button>
          </div>
          {!currentPresentationId && <p className="text-2xs text-muted">Mở một buổi nhóm để thêm câu Kinh Thánh.</p>}
        </div>
      </div>

      <ol className="min-w-0 flex-1 overflow-y-auto p-2" aria-label={`${name} đoạn ${chapter}`}>
        {verses.map((text, i) => {
          const n = i + 1
          const selected = n >= from && n <= to
          return (
            <li key={n} id={`verse-${n}`}>
              <button
                type="button"
                onClick={(e) => setRange(e.shiftKey && range ? [range[0], n] : [n, n])}
                className={`w-full rounded-md px-3 py-1.5 text-left text-[13px] leading-relaxed cursor-pointer ${
                  selected ? 'bg-select/15 text-fg' : 'text-fg-2 hover:bg-raised'
                }`}
              >
                <sup className="mr-1.5 font-bold text-select">{n}</sup>
                {text}
                {secondary && english[i] && <span className="mt-0.5 block text-xs italic text-muted">{english[i]}</span>}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

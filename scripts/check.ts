// Smoke check for the non-UI logic. Run: npm run check
import assert from 'node:assert/strict'
import { parseRef } from '../src/renderer/src/helpers/bibleRef'
import { orderedSections } from '../src/renderer/src/helpers/arrangement'
import { songToOpenLyrics } from '../src/renderer/src/helpers/openLyrics'
import { serviceItems } from '../src/renderer/src/helpers/serviceItems'
import { migrateSong } from '../src/renderer/src/helpers/songFactory'
import { parseSongMarkdown, songToMarkdown } from '../src/renderer/src/helpers/songMarkdown'
import { mergeSongIndex } from '../src/renderer/src/helpers/songRepo'
import { songMatches } from '../src/renderer/src/helpers/songSearch'
import { formatSeconds, messageText, pauseTimer, startTimer, timerSeconds } from '../src/renderer/src/helpers/timer'
import { resolveSlide } from '../src/renderer/src/helpers/theme'
import { useStore } from '../src/renderer/src/store'
import type { Song, Timer } from '../src/renderer/src/types'

// ── Bible references
const ref = (s: string) => {
  const r = parseRef(s)
  return r && [r.book[0], r.chapter, r.from, r.to]
}
assert.deepEqual(ref('Giăng 3:16'), ['JOH', 3, 16, 16])
assert.deepEqual(ref('gi 3:16-18'), ['JOH', 3, 16, 18])
assert.deepEqual(ref('1 Giăng 1:9'), ['1JO', 1, 9, 9])
assert.deepEqual(ref('Thi 23'), ['PSA', 23, undefined, undefined])
assert.deepEqual(ref('giô-suê 1:9'), ['JOS', 1, 9, 9])
assert.equal(ref('xyz 1:1'), undefined)

// ── Song markdown: metadata, order, songbooks, translation, section types
const md = `# Chúa Là Tình Yêu
## Author: Tác giả
## Songbook: Thánh Ca 123
## Songbook: TVCHH 45a
## Order: Verse 1, Điệp khúc, Verse 2, điệp khúc

[Verse 1]
a
---
A (en)
[Điệp khúc]
c
[Verse 2]
b`
const p = parseSongMarkdown(md)
assert.deepEqual(p.songbooks, [{ book: 'Thánh Ca', number: '123' }, { book: 'TVCHH', number: '45a' }])
assert.deepEqual(p.slides.map((s) => [s.sectionType, s.content, s.translation]), [
  ['verse', 'a', 'A (en)'],
  ['chorus', 'c', undefined],
  ['verse', 'b', undefined]
])
const song = { slides: p.slides, arrangements: [{ id: 'x', name: 'x', order: p.order! }], activeArrangementId: 'x' } as Song
assert.deepEqual(orderedSections(song).map((s) => s.content), ['a', 'c', 'b', 'c'])
// Round trip keeps everything the parser understands.
const again = parseSongMarkdown(songToMarkdown({ ...p, arrangements: song.arrangements }))
assert.deepEqual([again.title, again.songbooks, again.order, again.slides.map((s) => s.translation)], [p.title, p.songbooks, p.order, p.slides.map((s) => s.translation)])
assert.match(songToOpenLyrics({ ...song, title: p.title, songbooks: p.songbooks, tags: [], rawMarkdown: md } as Song), /<verseOrder>v1 c v2 c<\/verseOrder>/)

// ── Search ignores diacritics and matches hymnal numbers
const searchable = { ...song, title: p.title, songbooks: p.songbooks, tags: [] } as Song
assert.ok(songMatches(searchable, 'chua la tinh yeu'))
assert.ok(songMatches(searchable, 'tc 123'))
assert.ok(!songMatches(searchable, 'tc 999'))

// ── Legacy data migration
assert.deepEqual(migrateSong({ category: 'tvchh' } as unknown as Song).songbooks, [{ book: 'Tôn Vinh Chúa Hằng Hữu' }])

// ── Song repository merge never overwrites local edits
const local = [
  { id: '1', sourceId: 'r1', rawMarkdown: '# Old', syncedAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: '2', sourceId: 'r2', rawMarkdown: '# Old2', syncedAt: '2026-01-01', updatedAt: '2026-02-01', title: 'Edited' },
  { id: '3', sourceId: 'r3', rawMarkdown: '# Same', syncedAt: '2026-01-01', updatedAt: '2026-01-01' }
] as Song[]
const merged = mergeSongIndex(local, { songs: [{ id: 'r1', markdown: '# New' }, { id: 'r2', markdown: '# New2' }, { id: 'r3', markdown: '# Same' }, { id: 'r4', markdown: '# Brand new' }] }, 'now')
assert.deepEqual(
  [merged.toAdd.map((s) => s.title), merged.toUpdate.map((u) => u.id), merged.skippedEdited, merged.unchanged],
  [['Brand new'], ['1'], ['Edited'], 1]
)

// ── Timers
const t0: Timer = { id: 't', name: 'x', mode: 'countdown', durationSec: 300, targetTime: '09:00', running: false, accumulatedSec: 0 }
const running = startTimer(t0, 0)
assert.equal(formatSeconds(timerSeconds(running, 60_000)), '4:00')
assert.equal(formatSeconds(timerSeconds(pauseTimer(running, 90_000), 999_999)), '3:30')
assert.equal(formatSeconds(-5), '-0:05')
assert.equal(messageText({ id: 'm', text: 'Bắt đầu sau {timer}', target: 'audience', timerId: 't' }, [running], 60_000), 'Bắt đầu sau 4:00')

// ── Store: service order, themes, live navigation, clear layers
const store = useStore.getState()
const presId = store.createPresentation('Test')
store.addSlideGroup(presId, 'A', 'song', [{ content: '1' }, { content: '2' }], 'theme-lyrics')
store.addSlideGroup(presId, 'B', 'bible', [{ content: '3' }], 'theme-scripture')
const slides = () => useStore.getState().presentations.find((x) => x.id === presId)!.slides
const titles = () => serviceItems(slides()).map((i) => i.group?.title)
assert.deepEqual(titles(), ['A', 'B'])
const keyOf = (t: string) => serviceItems(slides()).find((i) => i.group?.title === t)!.key
store.moveGroup(presId, keyOf('B'), -1)
assert.deepEqual(titles(), ['B', 'A'])

const themed = resolveSlide(slides()[0], useStore.getState().themes)
assert.equal(themed.textBlocks[0].textAlign, 'left') // Scripture theme applied
assert.equal(themed.textBlocks[0].content, '3')

store.goNext() // nothing live → starts at the selected / first slide
const live = () => useStore.getState().liveSlideId
store.goLive(slides()[0].id)
store.goNext()
assert.equal(live(), slides()[1].id)
store.clear('text')
assert.equal(useStore.getState().layers.text, false)
store.goNext() // taking a slide live restores the text layer
assert.equal(useStore.getState().layers.text, true)
store.clear('all')
assert.equal(live(), null)
store.deleteGroup(presId, keyOf('A'))
assert.deepEqual(titles(), ['B'])

console.log('check: ok')

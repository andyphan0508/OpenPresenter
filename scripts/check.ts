// Smoke check for the non-UI logic. Run: npm run check
import assert from 'node:assert/strict'
import { parseRef } from '../src/renderer/src/helpers/bibleRef'
import { orderedSections } from '../src/renderer/src/helpers/arrangement'
import { songToOpenLyrics } from '../src/renderer/src/helpers/openLyrics'
import { serviceItems } from '../src/renderer/src/helpers/serviceItems'
import { migrateSong } from '../src/renderer/src/helpers/songFactory'
import { parseSongMarkdown, songToMarkdown } from '../src/renderer/src/helpers/songMarkdown'
import { mergeSongIndex } from '../src/renderer/src/helpers/songRepo'
import { arrangedSongItems, findSong, itemCue, lyricsMarkdown, parseProgram, resolveItem, type Program } from '../src/renderer/src/helpers/program'
import { parseThanhcaPage } from '../src/renderer/src/helpers/thanhca'
import { songMatches } from '../src/renderer/src/helpers/songSearch'
import { formatSeconds, messageText, pauseTimer, startTimer, timerSeconds } from '../src/renderer/src/helpers/timer'
import { resolveSlide } from '../src/renderer/src/helpers/theme'
import { keyBackground } from '../src/renderer/src/helpers/keyer'
import { fourCC } from '../src/main/services/decklinkService'
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

// ── Blackmagic output: DeckLink FourCCs + key canvas per mode
assert.equal(fourCC('BGRA'), 0x42475241)
assert.equal(fourCC('Hp30'), 0x48703330)
assert.equal(keyBackground('external'), 'transparent')
assert.equal(keyBackground('chroma'), '#00b140')
assert.equal(keyBackground('full'), undefined)
assert.equal(keyBackground('bogus'), undefined)

// ── Thánh Ca HTTLVN page → song (chorus printed after each verse becomes the sing order)
{
  const page = `<div class="col-xs-6 text-left">W. Sherwin, 1877</div><div class="col-xs-6 text-right">Dịch lời</div>
    <h1 class="tilte-normal"><small class="center-block"><span class="control-chord-display"></span> Th&#225;nh Ca 100</small> Chúa Mang Thập Hình</h1>
    <div id="lyric-content"><p><b>Câu 1</b></p><p><i class="chord-group">Ôi</i> Chúa</p><p></p><p>Jê-sus</p>
    <p><b>Điệp khúc 1</b></p><p>Cứu người</p><p><b>Câu 2</b></p><p>Ôi Chúa chí tôn</p><p><b>Điệp khúc </b></p><p>Cứu người</p></div>`
  const hymn = parseThanhcaPage(page, 100)!
  assert.equal(hymn.title, 'Chúa Mang Thập Hình')
  const song = parseSongMarkdown(hymn.markdown)
  assert.deepEqual(song.songbooks, [{ book: 'Thánh Ca', number: '100' }])
  assert.equal(song.author, 'W. Sherwin, 1877 · Dịch lời')
  assert.deepEqual(song.slides.map((s) => s.sectionLabel), ['Câu 1', 'Điệp khúc 1', 'Câu 2'])
  assert.equal(song.slides[0].content, 'Ôi Chúa\n\nJê-sus')
  assert.equal(song.slides[1].sectionType, 'chorus')
  assert.deepEqual(song.order, ['Câu 1', 'Điệp khúc 1', 'Câu 2', 'Điệp khúc 1'])
  const long = parseThanhcaPage(`<h1>X</h1><div id="lyric-content">${Array.from({ length: 20 }, (_, i) => `<p>l${i}</p>`).join('')}</div>`, 1)!
  assert.deepEqual(parseSongMarkdown(long.markdown).slides.map((s) => s.sectionLabel), ['Câu 1', 'Câu 1 – phần 2', 'Câu 1 – phần 3'])
  assert.equal(parseThanhcaPage('<html>500</html>', 1), undefined)
  assert.equal(findSong([{ ...useStore.getState().songs[0], songbooks: [{ book: 'Thánh Ca', number: '29' }] }], { title: '', book: 'Thánh Ca', number: '029' })?.songbooks[0].number, '29')
}

// ── Program v2: arrangement, sermon, cues, bilingual
{
  const hymn = { slides: parseSongMarkdown('# H\n[Câu 1]\na\n[Điệp khúc]\nb\n[Câu 2]\nc\n[Câu 2 – phần 2]\nc2').slides }
  const labels = (items: { label?: string }[]) => items.map((i) => i.label)
  assert.deepEqual(labels(arrangedSongItems(hymn, ['Câu 2', 'Điệp khúc', 'câu 1'])), ['Câu 2', 'Câu 2 – phần 2', 'Điệp khúc', 'Câu 1'])
  assert.deepEqual(labels(arrangedSongItems(hymn, ['Không có'])), ['Câu 1', 'Điệp khúc', 'Câu 2', 'Câu 2 – phần 2']) // unknown → song order
  assert.equal(itemCue({ id: 'x', kind: 'text', label: '', leader: 'MS. An', minutes: 5, note: 'Mời đứng' }), 'Phụ trách: MS. An · 5 phút · Mời đứng')

  const asked: [string, boolean][] = []
  const passage = async (ref: string, bilingual: boolean) => (asked.push([ref, bilingual]), [{ label: ref, content: 'v' }])
  ;(async () => {
    const sermon = await resolveItem(
      { id: 's', kind: 'sermon', label: 'Giảng luận', text: 'Ân điển', speaker: 'MS. Bình', ref: 'Êph 2:8', bilingual: true },
      [],
      passage
    )
    assert.equal(sermon.kind, 'bible')
    assert.equal(sermon.title, 'Giảng luận — Ân điển')
    assert.deepEqual(sermon.slides.map((x) => x.content), ['Ân điển\nMS. Bình', 'v'])
    assert.deepEqual(asked, [['Êph 2:8', true]])
    const song = await resolveItem(
      { id: 'g', kind: 'song', label: 'Tôn vinh', song: { title: 'Mới', lyrics: '[Verse 1]\na\n[Chorus]\nb', arrangement: ['Chorus', 'Verse 1', 'Chorus'] } },
      [],
      passage
    )
    assert.deepEqual(song.slides.map((x) => x.label), ['Chorus', 'Verse 1', 'Chorus'])
    console.log('check: program v2 ok')
  })().catch((e) => { console.error(e); process.exit(1) })
}

// ── Weekly program sync (dashboard → service)
{
  const lib = useStore.getState().songs
  const hymn = { ...lib[0], title: 'Ân Điển Diệu Kỳ', songbooks: [{ book: 'Thánh Ca', number: '12' }] }
  assert.equal(findSong([hymn], { title: 'x', book: 'thanh ca', number: '12' }), hymn)
  assert.equal(findSong([hymn], { title: 'x', number: '12' }), undefined) // number alone is ambiguous
  assert.equal(findSong([hymn], { title: 'an dien dieu ky' }), hymn)
  assert.match(lyricsMarkdown({ title: 'T', book: 'Thánh Ca', number: '5', lyrics: 'a\nb\n\nc' }), /## Songbook: Thánh Ca 5\n\n\[Verse 1\]\na\nb\n\n\[Verse 2\]\nc/)
  assert.throws(() => parseProgram('{"songs":[]}'))

  const program: Program = {
    id: 'p1', date: '2026-09-27', title: '', updatedAt: 'v1',
    items: [
      { id: 'w', kind: 'text', label: 'Chào mừng' },
      { id: 'v', kind: 'bible', label: 'Câu gốc', ref: 'Giăng 3:16' },
      { id: 's', kind: 'song', label: 'Tôn vinh', song: { title: 'Bài Mới', lyrics: '[Verse 1]\nla la' } },
      { id: 'm', kind: 'song', label: 'Tôn vinh', song: { title: 'Không Có' } }
    ]
  }
  const passage = async (ref: string) => (ref === 'Giăng 3:16' ? [{ label: ref, content: 'Vì Đức Chúa Trời yêu thương…' }] : undefined)
  const resolveAll = (p: Program) => Promise.all(p.items.map((i) => resolveItem(i, useStore.getState().songs, passage)))
  ;(async () => {
    const first = await resolveAll(program)
    assert.deepEqual(first.map((r) => r.status), ['ok', 'ok', 'new-song', 'missing'])
    const presId = useStore.getState().applyProgram(program, first)
    const pres = () => useStore.getState().presentations.find((p) => p.id === presId)!
    const groupTitles = () => serviceItems(pres().slides).map((i) => i.group?.title ?? 'manual')
    assert.equal(pres().name, 'Chúa Nhật 27/09/2026')
    assert.deepEqual(groupTitles(), ['Chào mừng', 'Câu gốc — Giăng 3:16', 'Bài Mới', 'Không Có'])
    assert.ok(useStore.getState().songs.some((s) => s.title === 'Bài Mới')) // lyrics landed in the library

    // Operator edits the welcome slide and adds an announcement after the Bible verse.
    const welcome = pres().slides[0]
    useStore.getState().updateTextBlock(presId, welcome.id, welcome.textBlocks[0].id, { content: 'Chào mừng quý khách!' })
    const added = useStore.getState().addSlide(presId) // lands at the end → move it up behind the verse
    for (let i = 0; i < 2; i++) useStore.getState().moveGroup(presId, added, -1)
    assert.deepEqual(groupTitles(), ['Chào mừng', 'Câu gốc — Giăng 3:16', 'manual', 'Bài Mới', 'Không Có'])

    // Dashboard changes: new verse, missing song dropped, one song added. Sync again.
    const v2: Program = { ...program, updatedAt: 'v2', items: [
      program.items[0], { ...program.items[1], ref: 'Thi 23' }, program.items[2], { id: 'n', kind: 'song', label: 'Tôn vinh', song: { title: 'Ân Điển' } }
    ] }
    assert.equal(useStore.getState().applyProgram(v2, await resolveAll(v2)), presId) // same service, not a new one
    assert.deepEqual(groupTitles(), ['Chào mừng', 'Câu gốc', 'manual', 'Bài Mới', 'Ân Điển'])
    assert.equal(pres().slides[0].textBlocks[0].content, 'Chào mừng quý khách!') // unchanged item kept the edit
    assert.equal(pres().program?.updatedAt, 'v2')
    console.log('check: program ok')
  })().catch((e) => { console.error(e); process.exit(1) })
}

console.log('check: ok')

import type { SongSection } from '../types'

// ProPresenter-style group colors. Hex is used on slide label bars; name for UI copy.
export const SECTION_META: Record<SongSection, { color: string; name: string }> = {
  verse: { color: '#2563eb', name: 'Verse' },
  chorus: { color: '#ea580c', name: 'Chorus' },
  bridge: { color: '#9333ea', name: 'Bridge' },
  'pre-chorus': { color: '#16a34a', name: 'Pre-Chorus' },
  intro: { color: '#0d9488', name: 'Intro' },
  outro: { color: '#e11d48', name: 'Outro' },
  tag: { color: '#db2777', name: 'Tag' }
}

export const SCRIPTURE_COLOR = '#0284c7'

export const sectionColor = (type?: SongSection) => (type ? SECTION_META[type].color : SCRIPTURE_COLOR)

// Header keyword → section type ("Verse 2", "Điệp khúc", "PC"...).
export const SECTION_KEYWORDS: [string, SongSection][] = [
  ['pre chorus', 'pre-chorus'],
  ['pc', 'pre-chorus'],
  ['chorus', 'chorus'],
  ['diep khuc', 'chorus'],
  ['bridge', 'bridge'],
  ['cau noi', 'bridge'],
  ['intro', 'intro'],
  ['outro', 'outro'],
  ['ending', 'outro'],
  ['tag', 'tag'],
  ['verse', 'verse'],
  ['doan', 'verse'],
  ['khuc', 'verse']
]

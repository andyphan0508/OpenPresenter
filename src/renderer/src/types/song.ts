export type SongSection = 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'tag' | 'pre-chorus'

export interface SongSlide {
  id: string
  sectionType: SongSection
  sectionLabel: string
  content: string
  translation?: string
}

// Sing order, e.g. ["Verse 1", "Chorus", "Verse 2", "Chorus"] — references sections by label.
export interface SongArrangement {
  id: string
  name: string
  order: string[]
}

// Hymnal reference, e.g. { book: 'Thánh Ca', number: '123' }.
export interface SongbookRef {
  book: string
  number?: string
}

export interface Song {
  id: string
  title: string
  author?: string
  copyright?: string
  ccli?: string
  songbooks: SongbookRef[]
  arrangements?: SongArrangement[]
  activeArrangementId?: string
  key?: string
  tempo?: number
  tags: string[]
  slides: SongSlide[]
  rawMarkdown: string
  // Song repository sync: which remote song this came from and when it was last pulled.
  sourceId?: string
  syncedAt?: string
  createdAt: string
  updatedAt: string
}

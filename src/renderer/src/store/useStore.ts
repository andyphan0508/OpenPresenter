import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  Presentation,
  Slide,
  SlideBackground,
  TextBlock,
  Song,
  SongSlide,
  SongStyle,
  MediaItem,
  OutputSettings,
  ProjectData,
  DEFAULT_OUTPUT_SETTINGS,
  DEFAULT_TEXT_BLOCK,
  DEFAULT_SONG_STYLE
} from '../types'

interface AppState {
  // Presentations
  presentations: Presentation[]
  currentPresentationId: string | null
  currentSlideId: string | null
  liveSlideId: string | null

  // Library
  songs: Song[]
  media: MediaItem[]

  // Output
  outputEnabled: boolean
  outputSettings: OutputSettings

  // UI State
  activePanel: 'presentations' | 'library' | 'settings'
  selectedSongId: string | null
  editingSlideId: string | null
  theme: 'dark' | 'light'

  // Project file
  currentFilePath: string | null
  dirty: boolean

  // Actions - Presentation
  createPresentation: (name: string) => string
  deletePresentation: (id: string) => void
  setCurrentPresentation: (id: string | null) => void
  updatePresentation: (id: string, updates: Partial<Presentation>) => void

  // Actions - Slides
  addSlide: (presentationId: string) => string
  addSlidesFromSong: (presentationId: string, song: Song) => void
  deleteSlide: (presentationId: string, slideId: string) => void
  updateSlide: (presentationId: string, slideId: string, updates: Partial<Slide>) => void
  reorderSlides: (presentationId: string, slides: Slide[]) => void
  moveSlide: (presentationId: string, from: number, to: number) => void
  setCurrentSlide: (slideId: string | null) => void
  setLiveSlide: (slideId: string | null) => void
  duplicateSlide: (presentationId: string, slideId: string) => void
  applyBackgroundToAll: (presentationId: string, background: SlideBackground) => void

  // Actions - Text Blocks
  addTextBlock: (presentationId: string, slideId: string) => string
  updateTextBlock: (
    presentationId: string,
    slideId: string,
    blockId: string,
    updates: Partial<TextBlock>
  ) => void
  deleteTextBlock: (presentationId: string, slideId: string, blockId: string) => void

  // Actions - Songs
  addSong: (song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateSong: (id: string, updates: Partial<Song>) => void
  updateSongFromMarkdown: (id: string, markdown: string) => void
  updateSongStyle: (id: string, style: Partial<SongStyle>) => void
  deleteSong: (id: string) => void
  importSongFromMarkdown: (markdown: string, category: Song['category']) => string

  // Actions - Media library
  addMedia: (item: Omit<MediaItem, 'id' | 'createdAt'>) => string
  deleteMedia: (id: string) => void

  // Actions - Output
  setOutputEnabled: (enabled: boolean) => void
  updateOutputSettings: (settings: Partial<OutputSettings>) => void

  // Actions - UI
  setActivePanel: (panel: AppState['activePanel']) => void
  setSelectedSong: (id: string | null) => void
  setEditingSlide: (id: string | null) => void
  toggleTheme: () => void

  // Actions - Project file
  setProjectFile: (path: string | null) => void
  markDirty: () => void
  loadProjectData: (data: ProjectData) => void
  exportProjectData: () => ProjectData

  // Computed helpers
  getCurrentPresentation: () => Presentation | undefined
  getCurrentSlide: () => Slide | undefined
  getLiveSlide: () => Slide | undefined
}

function createDefaultSlide(): Slide {
  return {
    id: uuidv4(),
    background: { type: 'color', value: '#000000' },
    textBlocks: [
      {
        ...DEFAULT_TEXT_BLOCK,
        id: uuidv4()
      }
    ],
    notes: '',
    transition: 'fade',
    duration: 0
  }
}

function parseSongMarkdown(markdown: string): { slides: Song['slides']; title: string; author?: string; key?: string } {
  const lines = markdown.split('\n')
  let title = 'Untitled Song'
  let author: string | undefined
  let key: string | undefined
  const slides: Song['slides'] = []

  let currentSection: Song['slides'][0] | null = null
  let contentLines: string[] = []

  const sectionPatterns: Record<string, Song['slides'][0]['sectionType']> = {
    verse: 'verse',
    chorus: 'chorus',
    bridge: 'bridge',
    intro: 'intro',
    outro: 'outro',
    tag: 'tag',
    'pre-chorus': 'pre-chorus',
    pc: 'pre-chorus'
  }

  const pushSection = () => {
    if (currentSection && contentLines.length > 0) {
      slides.push({
        ...currentSection,
        content: contentLines.join('\n').trim()
      })
    }
    contentLines = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Title: # Song Title
    if (trimmed.startsWith('# ')) {
      title = trimmed.slice(2).trim()
      continue
    }

    // Metadata: ## Author: name
    if (trimmed.startsWith('## Author:')) {
      author = trimmed.slice(10).trim()
      continue
    }
    if (trimmed.startsWith('## Key:')) {
      key = trimmed.slice(7).trim()
      continue
    }

    // Section header: [Verse 1] or [Chorus] or ## Verse 1
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/) || trimmed.match(/^##\s+(.+)$/)
    if (sectionMatch) {
      pushSection()
      const sectionText = sectionMatch[1].toLowerCase()
      let sectionType: Song['slides'][0]['sectionType'] = 'verse'

      for (const [key, type] of Object.entries(sectionPatterns)) {
        if (sectionText.includes(key)) {
          sectionType = type
          break
        }
      }

      currentSection = {
        id: uuidv4(),
        sectionType,
        sectionLabel: sectionMatch[1],
        content: ''
      }
      continue
    }

    if (currentSection !== null) {
      contentLines.push(line)
    }
  }

  pushSection()

  // If no sections found, treat whole content as one slide
  if (slides.length === 0 && markdown.trim()) {
    slides.push({
      id: uuidv4(),
      sectionType: 'verse',
      sectionLabel: 'Verse 1',
      content: markdown.trim()
    })
  }

  return { slides, title, author, key }
}

/** Derive a song style from global output settings (used when a song has no saved style). */
function styleFromSettings(settings: OutputSettings): SongStyle {
  return {
    ...DEFAULT_SONG_STYLE,
    fontSize: settings.defaultFontSize,
    fontFamily: settings.defaultFontFamily,
    color: settings.defaultTextColor,
    textAlign: settings.defaultTextAlign
  }
}

/** Split a section's content into chunks of at most `maxLines` lines (0 = no split). */
function splitContent(content: string, maxLines: number): string[] {
  const lines = content.split('\n')
  if (!maxLines || maxLines <= 0 || lines.length <= maxLines) return [content]
  const chunks: string[] = []
  for (let i = 0; i < lines.length; i += maxLines) {
    chunks.push(lines.slice(i, i + maxLines).join('\n'))
  }
  return chunks
}

function buildTextBlock(content: string, style: SongStyle): TextBlock {
  return {
    id: uuidv4(),
    content,
    x: 5,
    y: 15,
    width: 90,
    height: 70,
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontStyle: 'normal',
    color: style.color,
    textAlign: style.textAlign,
    textShadow: style.textShadow,
    shadowColor: style.shadowColor,
    shadowBlur: style.shadowBlur,
    lineHeight: style.lineHeight,
    textTransform: style.textTransform,
    outline: style.outline,
    outlineColor: style.outlineColor,
    outlineWidth: style.outlineWidth
  }
}

/** Convert one song section into one or more presentation slides, applying a style. */
function songSlideToPresSlides(songSlide: SongSlide, style: SongStyle): Slide[] {
  const parts = splitContent(songSlide.content, style.maxLinesPerSlide)
  return parts.map((part, i) => ({
    id: uuidv4(),
    background: { ...style.background },
    textBlocks: [buildTextBlock(part, style)],
    notes:
      parts.length > 1
        ? `[${songSlide.sectionLabel} ${i + 1}/${parts.length}]`
        : `[${songSlide.sectionLabel}]`,
    transition: 'fade',
    duration: 0
  }))
}

const DEMO_SONGS: Song[] = [
  {
    id: uuidv4(),
    title: 'Amazing Grace',
    author: 'John Newton',
    category: 'thanh-ca',
    key: 'G',
    tags: ['worship', 'classic'],
    rawMarkdown: `# Amazing Grace
## Author: John Newton
## Key: G

[Verse 1]
Amazing grace how sweet the sound
That saved a wretch like me
I once was lost but now am found
Was blind but now I see

[Verse 2]
'Twas grace that taught my heart to fear
And grace my fears relieved
How precious did that grace appear
The hour I first believed

[Chorus]
My chains are gone, I've been set free
My God, my Savior has ransomed me
And like a flood His mercy reigns
Unending love, amazing grace`,
    slides: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    title: 'Thánh Thay',
    author: '',
    category: 'biet-thanh-ca',
    key: 'C',
    tags: ['worship'],
    rawMarkdown: `# Thánh Thay
## Key: C

[Verse 1]
Thánh thay, thánh thay
Chúa Đức Chúa Trời Toàn Năng
Là Đấng đã có, đang có và còn đến

[Chorus]
Đáng được tôn ngợi
Đáng được tôn vinh
Đáng nhận lấy sự vinh hiển
Vinh hiển và năng quyền`,
    slides: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Parse demo songs
DEMO_SONGS.forEach((song) => {
  const parsed = parseSongMarkdown(song.rawMarkdown)
  song.slides = parsed.slides
  if (!song.title && parsed.title) song.title = parsed.title
  if (!song.author && parsed.author) song.author = parsed.author
})

export const useStore = create<AppState>()((set, get) => ({
  presentations: [],
  currentPresentationId: null,
  currentSlideId: null,
  liveSlideId: null,
  songs: DEMO_SONGS,
  media: [],
  outputEnabled: false,
  outputSettings: DEFAULT_OUTPUT_SETTINGS,
  activePanel: 'presentations',
  selectedSongId: null,
  editingSlideId: null,
  theme: 'dark',
  currentFilePath: null,
  dirty: false,

  createPresentation: (name) => {
    const id = uuidv4()
    const defaultSlide = createDefaultSlide()
    const presentation: Presentation = {
      id,
      name,
      slides: [defaultSlide],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    set((state) => ({
      presentations: [...state.presentations, presentation],
      currentPresentationId: id,
      currentSlideId: defaultSlide.id
    }))
    return id
  },

  deletePresentation: (id) => {
    set((state) => ({
      presentations: state.presentations.filter((p) => p.id !== id),
      currentPresentationId: state.currentPresentationId === id ? null : state.currentPresentationId
    }))
  },

  setCurrentPresentation: (id) => {
    const pres = get().presentations.find((p) => p.id === id)
    set({
      currentPresentationId: id,
      currentSlideId: pres?.slides[0]?.id ?? null
    })
  },

  updatePresentation: (id, updates) => {
    set((state) => ({
      presentations: state.presentations.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    }))
  },

  addSlide: (presentationId) => {
    const newSlide = createDefaultSlide()
    set((state) => ({
      presentations: state.presentations.map((p) =>
        p.id === presentationId ? { ...p, slides: [...p.slides, newSlide] } : p
      ),
      currentSlideId: newSlide.id
    }))
    return newSlide.id
  },

  addSlidesFromSong: (presentationId, song) => {
    const { outputSettings } = get()
    const style = song.style ?? styleFromSettings(outputSettings)
    const newSlides = song.slides.flatMap((ss) => songSlideToPresSlides(ss, style))
    set((state) => ({
      presentations: state.presentations.map((p) =>
        p.id === presentationId
          ? { ...p, slides: [...p.slides, ...newSlides], updatedAt: new Date().toISOString() }
          : p
      ),
      currentSlideId: newSlides[0]?.id ?? state.currentSlideId
    }))
  },

  deleteSlide: (presentationId, slideId) => {
    set((state) => {
      const pres = state.presentations.find((p) => p.id === presentationId)
      if (!pres) return state
      const newSlides = pres.slides.filter((s) => s.id !== slideId)
      return {
        presentations: state.presentations.map((p) =>
          p.id === presentationId ? { ...p, slides: newSlides } : p
        ),
        currentSlideId:
          state.currentSlideId === slideId ? (newSlides[0]?.id ?? null) : state.currentSlideId
      }
    })
  },

  updateSlide: (presentationId, slideId, updates) => {
    set((state) => ({
      presentations: state.presentations.map((p) =>
        p.id === presentationId
          ? {
              ...p,
              slides: p.slides.map((s) => (s.id === slideId ? { ...s, ...updates } : s)),
              updatedAt: new Date().toISOString()
            }
          : p
      )
    }))
  },

  reorderSlides: (presentationId, slides) => {
    set((state) => ({
      presentations: state.presentations.map((p) =>
        p.id === presentationId ? { ...p, slides, updatedAt: new Date().toISOString() } : p
      )
    }))
  },

  moveSlide: (presentationId, from, to) => {
    set((state) => {
      const pres = state.presentations.find((p) => p.id === presentationId)
      if (!pres) return state
      if (from < 0 || from >= pres.slides.length || to < 0 || to >= pres.slides.length) return state
      const slides = [...pres.slides]
      const [moved] = slides.splice(from, 1)
      slides.splice(to, 0, moved)
      return {
        presentations: state.presentations.map((p) =>
          p.id === presentationId ? { ...p, slides, updatedAt: new Date().toISOString() } : p
        )
      }
    })
  },

  applyBackgroundToAll: (presentationId, background) => {
    set((state) => ({
      presentations: state.presentations.map((p) =>
        p.id === presentationId
          ? {
              ...p,
              slides: p.slides.map((s) => ({ ...s, background: { ...background } })),
              updatedAt: new Date().toISOString()
            }
          : p
      )
    }))
  },

  setCurrentSlide: (slideId) => set({ currentSlideId: slideId }),

  setLiveSlide: (slideId) => set({ liveSlideId: slideId }),

  duplicateSlide: (presentationId, slideId) => {
    const pres = get().presentations.find((p) => p.id === presentationId)
    if (!pres) return
    const slide = pres.slides.find((s) => s.id === slideId)
    if (!slide) return
    const newSlide: Slide = {
      ...slide,
      id: uuidv4(),
      textBlocks: slide.textBlocks.map((tb) => ({ ...tb, id: uuidv4() }))
    }
    const idx = pres.slides.findIndex((s) => s.id === slideId)
    const newSlides = [...pres.slides]
    newSlides.splice(idx + 1, 0, newSlide)
    set((state) => ({
      presentations: state.presentations.map((p) =>
        p.id === presentationId ? { ...p, slides: newSlides } : p
      ),
      currentSlideId: newSlide.id
    }))
  },

  addTextBlock: (presentationId, slideId) => {
    const id = uuidv4()
    const block: TextBlock = { ...DEFAULT_TEXT_BLOCK, id }
    set((state) => ({
      presentations: state.presentations.map((p) =>
        p.id === presentationId
          ? {
              ...p,
              slides: p.slides.map((s) =>
                s.id === slideId ? { ...s, textBlocks: [...s.textBlocks, block] } : s
              )
            }
          : p
      )
    }))
    return id
  },

  updateTextBlock: (presentationId, slideId, blockId, updates) => {
    set((state) => ({
      presentations: state.presentations.map((p) =>
        p.id === presentationId
          ? {
              ...p,
              slides: p.slides.map((s) =>
                s.id === slideId
                  ? {
                      ...s,
                      textBlocks: s.textBlocks.map((tb) =>
                        tb.id === blockId ? { ...tb, ...updates } : tb
                      )
                    }
                  : s
              )
            }
          : p
      )
    }))
  },

  deleteTextBlock: (presentationId, slideId, blockId) => {
    set((state) => ({
      presentations: state.presentations.map((p) =>
        p.id === presentationId
          ? {
              ...p,
              slides: p.slides.map((s) =>
                s.id === slideId
                  ? { ...s, textBlocks: s.textBlocks.filter((tb) => tb.id !== blockId) }
                  : s
              )
            }
          : p
      )
    }))
  },

  addSong: (song) => {
    const id = uuidv4()
    const now = new Date().toISOString()
    set((state) => ({
      songs: [...state.songs, { ...song, id, createdAt: now, updatedAt: now }]
    }))
    return id
  },

  updateSong: (id, updates) => {
    set((state) => ({
      songs: state.songs.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      )
    }))
  },

  updateSongFromMarkdown: (id, markdown) => {
    const parsed = parseSongMarkdown(markdown)
    set((state) => ({
      songs: state.songs.map((s) =>
        s.id === id
          ? {
              ...s,
              title: parsed.title || s.title,
              author: parsed.author ?? s.author,
              key: parsed.key ?? s.key,
              slides: parsed.slides,
              rawMarkdown: markdown,
              updatedAt: new Date().toISOString()
            }
          : s
      )
    }))
  },

  updateSongStyle: (id, style) => {
    set((state) => ({
      songs: state.songs.map((s) =>
        s.id === id
          ? {
              ...s,
              style: { ...DEFAULT_SONG_STYLE, ...s.style, ...style },
              updatedAt: new Date().toISOString()
            }
          : s
      )
    }))
  },

  deleteSong: (id) => {
    set((state) => ({ songs: state.songs.filter((s) => s.id !== id) }))
  },

  importSongFromMarkdown: (markdown, category) => {
    const parsed = parseSongMarkdown(markdown)
    return get().addSong({
      title: parsed.title,
      author: parsed.author,
      category,
      key: parsed.key,
      tags: [],
      slides: parsed.slides,
      rawMarkdown: markdown
    })
  },

  addMedia: (item) => {
    const id = uuidv4()
    set((state) => ({
      media: [{ ...item, id, createdAt: new Date().toISOString() }, ...state.media]
    }))
    return id
  },

  deleteMedia: (id) => {
    set((state) => ({ media: state.media.filter((m) => m.id !== id) }))
  },

  setOutputEnabled: (enabled) => set({ outputEnabled: enabled }),

  updateOutputSettings: (settings) => {
    set((state) => ({ outputSettings: { ...state.outputSettings, ...settings } }))
  },

  setActivePanel: (panel) => set({ activePanel: panel }),
  setSelectedSong: (id) => set({ selectedSongId: id }),
  setEditingSlide: (id) => set({ editingSlideId: id }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  setProjectFile: (path) => set({ currentFilePath: path, dirty: false }),

  markDirty: () => set((state) => (state.dirty ? state : { dirty: true })),

  loadProjectData: (data) =>
    set({
      presentations: data.presentations ?? [],
      songs: data.songs ?? [],
      media: data.media ?? [],
      outputSettings: { ...DEFAULT_OUTPUT_SETTINGS, ...(data.outputSettings ?? {}) },
      theme: data.theme ?? 'dark',
      // Reset transient selection/live state for the freshly opened project
      currentPresentationId: data.presentations?.[0]?.id ?? null,
      currentSlideId: data.presentations?.[0]?.slides?.[0]?.id ?? null,
      liveSlideId: null,
      selectedSongId: null,
      editingSlideId: null,
      dirty: false
    }),

  exportProjectData: () => {
    const { presentations, songs, media, outputSettings, theme } = get()
    return { presentations, songs, media, outputSettings, theme }
  },

  getCurrentPresentation: () => {
    const { presentations, currentPresentationId } = get()
    return presentations.find((p) => p.id === currentPresentationId)
  },

  getCurrentSlide: () => {
    const { currentSlideId } = get()
    const pres = get().getCurrentPresentation()
    return pres?.slides.find((s) => s.id === currentSlideId)
  },

  getLiveSlide: () => {
    const { liveSlideId } = get()
    const pres = get().getCurrentPresentation()
    return pres?.slides.find((s) => s.id === liveSlideId)
  }
}))

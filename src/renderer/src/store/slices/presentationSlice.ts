import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_TEXT_BLOCK } from '../../constants/defaults'
import { itemCue, mergeProgramSlides, programName, type Program, type ResolvedItem } from '../../helpers/program'
import { moveItem, removeItem } from '../../helpers/serviceItems'
import { createBlankSlide, createThemedSlide, duplicateSlide, songItems, type GroupItem } from '../../helpers/slideFactory'
import { detachTheme } from '../../helpers/theme'
import type { Presentation, Slide, SlideGroup, SlideTransition, Song, TextBlock } from '../../types'
import type { AppState, SliceCreator } from '../types'

// Presentations = services (buổi nhóm); slides grouped into service items.
export interface PresentationSlice {
  presentations: Presentation[]
  currentPresentationId: string | null
  currentSlideId: string | null

  createPresentation: (name: string) => string
  deletePresentation: (id: string) => void
  renamePresentation: (id: string, name: string) => void
  setCurrentPresentation: (id: string | null) => void
  setCurrentSlide: (slideId: string | null) => void

  addSlide: (presId: string) => string
  updateSlide: (presId: string, slideId: string, updates: Partial<Slide>) => void
  setAllTransitions: (presId: string, transition: SlideTransition) => void
  deleteSlide: (presId: string, slideId: string) => void
  duplicateSlide: (presId: string, slideId: string) => void
  detachSlideTheme: (presId: string, slideId: string) => void

  addTextBlock: (presId: string, slideId: string) => string
  updateTextBlock: (presId: string, slideId: string, blockId: string, updates: Partial<TextBlock>) => void
  deleteTextBlock: (presId: string, slideId: string, blockId: string) => void

  addSlideGroup: (presId: string, title: string, kind: SlideGroup['kind'], items: GroupItem[], themeId: string) => string | undefined
  addSongToService: (presId: string, song: Song) => string | undefined
  applyProgram: (program: Program, resolved: ResolvedItem[]) => string
  moveGroup: (presId: string, key: string, dir: -1 | 1) => void
  deleteGroup: (presId: string, key: string) => void
  updateGroup: (presId: string, groupId: string, updates: Partial<SlideGroup>) => void
  setGroupTheme: (presId: string, groupId: string, themeId: string) => void

  getCurrentPresentation: () => Presentation | undefined
  getCurrentSlide: () => Slide | undefined
}

const now = () => new Date().toISOString()

// Replace one presentation's slides, stamping updatedAt.
const withSlides = (state: AppState, presId: string, fn: (slides: Slide[]) => Slide[]) => ({
  presentations: state.presentations.map((p) =>
    p.id === presId ? { ...p, slides: fn(p.slides), updatedAt: now() } : p
  )
})

const mapSlide = (slides: Slide[], slideId: string, fn: (s: Slide) => Slide) =>
  slides.map((s) => (s.id === slideId ? fn(s) : s))

export const createPresentationSlice: SliceCreator<PresentationSlice> = (set, get) => ({
  presentations: [],
  currentPresentationId: null,
  currentSlideId: null,

  createPresentation: (name) => {
    const pres: Presentation = { id: uuidv4(), name, slides: [], createdAt: now(), updatedAt: now() }
    set((s) => ({ presentations: [...s.presentations, pres], currentPresentationId: pres.id, currentSlideId: null }))
    return pres.id
  },

  deletePresentation: (id) =>
    set((s) => ({
      presentations: s.presentations.filter((p) => p.id !== id),
      currentPresentationId: s.currentPresentationId === id ? null : s.currentPresentationId
    })),

  renamePresentation: (id, name) =>
    set((s) => ({ presentations: s.presentations.map((p) => (p.id === id ? { ...p, name, updatedAt: now() } : p)) })),

  setCurrentPresentation: (id) => {
    const pres = get().presentations.find((p) => p.id === id)
    set({ currentPresentationId: id, currentSlideId: pres?.slides[0]?.id ?? null })
  },

  setCurrentSlide: (slideId) => set({ currentSlideId: slideId }),

  addSlide: (presId) => {
    const slide = createBlankSlide()
    set((s) => ({ ...withSlides(s, presId, (slides) => [...slides, slide]), currentSlideId: slide.id }))
    return slide.id
  },

  updateSlide: (presId, slideId, updates) =>
    set((s) => withSlides(s, presId, (slides) => mapSlide(slides, slideId, (sl) => ({ ...sl, ...updates })))),

  setAllTransitions: (presId, transition) =>
    set((s) => withSlides(s, presId, (slides) => slides.map((sl) => ({ ...sl, transition })))),

  deleteSlide: (presId, slideId) =>
    set((s) => {
      const next = withSlides(s, presId, (slides) => slides.filter((sl) => sl.id !== slideId))
      return { ...next, currentSlideId: s.currentSlideId === slideId ? null : s.currentSlideId }
    }),

  duplicateSlide: (presId, slideId) => {
    const copy = get().presentations.find((p) => p.id === presId)?.slides.find((sl) => sl.id === slideId)
    if (!copy) return
    const dup = duplicateSlide(copy)
    set((s) => ({
      ...withSlides(s, presId, (slides) => slides.flatMap((sl) => (sl.id === slideId ? [sl, dup] : [sl]))),
      currentSlideId: dup.id
    }))
  },

  detachSlideTheme: (presId, slideId) =>
    set((s) => withSlides(s, presId, (slides) => mapSlide(slides, slideId, (sl) => detachTheme(sl, s.themes)))),

  addTextBlock: (presId, slideId) => {
    const block: TextBlock = { ...DEFAULT_TEXT_BLOCK, id: uuidv4() }
    set((s) => withSlides(s, presId, (slides) => mapSlide(slides, slideId, (sl) => ({ ...sl, textBlocks: [...sl.textBlocks, block] }))))
    return block.id
  },

  updateTextBlock: (presId, slideId, blockId, updates) =>
    set((s) =>
      withSlides(s, presId, (slides) =>
        mapSlide(slides, slideId, (sl) => ({
          ...sl,
          textBlocks: sl.textBlocks.map((tb) => (tb.id === blockId ? { ...tb, ...updates } : tb))
        }))
      )
    ),

  deleteTextBlock: (presId, slideId, blockId) =>
    set((s) =>
      withSlides(s, presId, (slides) =>
        mapSlide(slides, slideId, (sl) => ({ ...sl, textBlocks: sl.textBlocks.filter((tb) => tb.id !== blockId) }))
      )
    ),

  addSlideGroup: (presId, title, kind, items, themeId) => {
    const group: SlideGroup = { id: uuidv4(), title, kind }
    const newSlides = items.map((item) => createThemedSlide(item, group, themeId))
    set((s) => ({
      ...withSlides(s, presId, (slides) => [...slides, ...newSlides]),
      currentSlideId: newSlides[0]?.id ?? s.currentSlideId
    }))
    return newSlides[0]?.id
  },

  addSongToService: (presId, song) =>
    get().addSlideGroup(presId, song.title, 'song', songItems(song), get().settings.songThemeId),

  // Weekly program → a service. Same program again = merge into the existing service, keeping local edits.
  applyProgram: (program, resolved) => {
    const { settings, addSong } = get()
    for (const r of resolved) if (r.newSong) addSong(r.newSong)
    const fresh = resolved.map((r) => {
      const group: SlideGroup = { id: uuidv4(), title: r.title, kind: r.kind, programItem: { id: r.item.id, sig: r.sig } }
      const themeId = r.kind === 'bible' ? settings.bibleThemeId : settings.songThemeId
      const slides = r.slides.map((item) => createThemedSlide(item, group, themeId))
      slides[0].notes = itemCue(r.item)
      return { itemId: r.item.id, sig: r.sig, slides }
    })
    const source = { id: program.id, updatedAt: program.updatedAt }
    const existing = get().presentations.find((p) => p.program?.id === program.id)
    if (existing) {
      set((s) => ({
        presentations: s.presentations.map((p) =>
          p.id === existing.id ? { ...p, program: source, slides: mergeProgramSlides(p.slides, fresh), updatedAt: now() } : p
        )
      }))
      get().setCurrentPresentation(existing.id)
      return existing.id
    }
    const pres: Presentation = {
      id: uuidv4(), name: programName(program), program: source, slides: fresh.flatMap((f) => f.slides), createdAt: now(), updatedAt: now()
    }
    set((s) => ({ presentations: [...s.presentations, pres] }))
    get().setCurrentPresentation(pres.id)
    return pres.id
  },

  moveGroup: (presId, key, dir) => set((s) => withSlides(s, presId, (slides) => moveItem(slides, key, dir))),

  deleteGroup: (presId, key) =>
    set((s) => {
      const next = withSlides(s, presId, (slides) => removeItem(slides, key))
      const remaining = next.presentations.find((p) => p.id === presId)?.slides ?? []
      const keep = (id: string | null) => (id && remaining.some((sl) => sl.id === id) ? id : null)
      return { ...next, currentSlideId: keep(s.currentSlideId), liveSlideId: keep(s.liveSlideId) }
    }),

  updateGroup: (presId, groupId, updates) =>
    set((s) =>
      withSlides(s, presId, (slides) =>
        slides.map((sl) => (sl.group?.id === groupId ? { ...sl, group: { ...sl.group, ...updates } } : sl))
      )
    ),

  setGroupTheme: (presId, groupId, themeId) =>
    set((s) => withSlides(s, presId, (slides) => slides.map((sl) => (sl.group?.id === groupId ? { ...sl, themeId } : sl)))),

  getCurrentPresentation: () => {
    const { presentations, currentPresentationId } = get()
    return presentations.find((p) => p.id === currentPresentationId)
  },

  getCurrentSlide: () => get().getCurrentPresentation()?.slides.find((s) => s.id === get().currentSlideId)
})

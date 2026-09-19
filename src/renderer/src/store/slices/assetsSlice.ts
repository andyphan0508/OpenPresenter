import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_THEMES } from '../../constants/defaults'
import type { MediaItem, Prop, Theme } from '../../types'
import type { SliceCreator } from '../types'

// Reusable look & media: themes, media bin, props.
export interface AssetsSlice {
  themes: Theme[]
  media: MediaItem[]
  props: Prop[]

  duplicateTheme: (id: string) => string
  updateTheme: (id: string, updates: Partial<Theme>) => void
  deleteTheme: (id: string) => void

  addMedia: (items: Omit<MediaItem, 'id'>[]) => void
  updateMedia: (id: string, updates: Partial<MediaItem>) => void
  removeMedia: (id: string) => void

  addProp: (prop: Omit<Prop, 'id'>) => void
  updateProp: (id: string, updates: Partial<Prop>) => void
  deleteProp: (id: string) => void
}

export const createAssetsSlice: SliceCreator<AssetsSlice> = (set, get) => ({
  themes: DEFAULT_THEMES,
  media: [],
  props: [],

  duplicateTheme: (id) => {
    const source = get().themes.find((t) => t.id === id) ?? DEFAULT_THEMES[0]
    const copy = { ...structuredClone(source), id: uuidv4(), name: `${source.name} (bản sao)` }
    set((s) => ({ themes: [...s.themes, copy] }))
    return copy.id
  },

  updateTheme: (id, updates) => set((s) => ({ themes: s.themes.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

  // Built-in themes stay: settings and existing slides point at them.
  deleteTheme: (id) =>
    set((s) => ({ themes: DEFAULT_THEMES.some((t) => t.id === id) ? s.themes : s.themes.filter((t) => t.id !== id) })),

  addMedia: (items) => set((s) => ({ media: [...s.media, ...items.map((m) => ({ ...m, id: uuidv4() }))] })),

  updateMedia: (id, updates) => set((s) => ({ media: s.media.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),

  removeMedia: (id) =>
    set((s) => ({ media: s.media.filter((m) => m.id !== id), liveMediaId: s.liveMediaId === id ? null : s.liveMediaId })),

  addProp: (prop) => set((s) => ({ props: [...s.props, { ...prop, id: uuidv4() }] })),

  updateProp: (id, updates) => set((s) => ({ props: s.props.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),

  deleteProp: (id) =>
    set((s) => ({ props: s.props.filter((p) => p.id !== id), activePropIds: s.activePropIds.filter((p) => p !== id) }))
})

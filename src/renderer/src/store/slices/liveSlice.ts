import { ALL_LAYERS_ON } from '../../constants/defaults'
import type { ClearTarget, MediaClock, OutputLayers } from '../../types'
import type { SliceCreator } from '../types'

// What is on the audience screen right now.
export interface LiveSlice {
  liveSlideId: string | null
  layers: OutputLayers
  liveMediaId: string | null
  activePropIds: string[]
  activeMessageId: string | null
  mediaClock: MediaClock | null

  goLive: (slideId: string | null) => void
  goNext: () => void
  goPrev: () => void
  clear: (target: ClearTarget) => void
  setLiveMedia: (mediaId: string | null) => void
  toggleProp: (propId: string) => void
  setActiveMessage: (messageId: string | null) => void
  setMediaClock: (clock: MediaClock | null) => void
}

export const createLiveSlice: SliceCreator<LiveSlice> = (set, get) => {
  const step = (dir: 1 | -1) => {
    const slides = get().getCurrentPresentation()?.slides ?? []
    const { liveSlideId, currentSlideId } = get()
    const idx = slides.findIndex((s) => s.id === liveSlideId)
    // Nothing live yet: start from the selected slide (or the first one).
    const target = idx < 0 ? (slides.find((s) => s.id === currentSlideId) ?? slides[0]) : slides[idx + dir]
    if (target) get().goLive(target.id)
  }

  return {
    liveSlideId: null,
    layers: ALL_LAYERS_ON,
    liveMediaId: null,
    activePropIds: [],
    activeMessageId: null,
    mediaClock: null,

    // Taking a slide live brings the slide layers back (like ProPresenter after a Clear Slide).
    goLive: (slideId) =>
      set({ liveSlideId: slideId, layers: ALL_LAYERS_ON, ...(slideId ? { currentSlideId: slideId } : {}) }),

    goNext: () => step(1),
    goPrev: () => step(-1),

    clear: (target) => {
      switch (target) {
        case 'all':
          return set({ liveSlideId: null, liveMediaId: null, activePropIds: [], activeMessageId: null, layers: ALL_LAYERS_ON })
        case 'text':
          return set((s) => ({ layers: { ...s.layers, text: false } }))
        case 'media':
          return set((s) => ({ liveMediaId: null, layers: { ...s.layers, media: false } }))
        case 'props':
          return set({ activePropIds: [] })
        case 'messages':
          return set({ activeMessageId: null })
      }
    },

    setLiveMedia: (mediaId) => set((s) => ({ liveMediaId: mediaId, layers: { ...s.layers, media: true } })),

    toggleProp: (propId) =>
      set((s) => ({
        activePropIds: s.activePropIds.includes(propId)
          ? s.activePropIds.filter((id) => id !== propId)
          : [...s.activePropIds, propId]
      })),

    setActiveMessage: (messageId) => set({ activeMessageId: messageId }),

    setMediaClock: (mediaClock) => set({ mediaClock })
  }
}

import { v4 as uuidv4 } from 'uuid'
import type { SliceCreator } from '../types'

export interface OcrImage {
  id: string
  name: string
  src: string // downscaled JPEG data URL
  text: string
  status: 'idle' | 'loading' | 'done' | 'error'
  error?: string
}

// Images waiting for OCR — in-memory cache only (not persisted), survives closing the bin.
export interface OcrSlice {
  ocrImages: OcrImage[]
  selectedOcrId: string | null

  addOcrImage: (name: string, src: string) => string
  updateOcrImage: (id: string, updates: Partial<OcrImage>) => void
  removeOcrImage: (id: string) => void
  selectOcrImage: (id: string | null) => void
}

export const createOcrSlice: SliceCreator<OcrSlice> = (set) => ({
  ocrImages: [],
  selectedOcrId: null,

  addOcrImage: (name, src) => {
    const id = uuidv4()
    set((s) => ({ ocrImages: [...s.ocrImages, { id, name, src, text: '', status: 'idle' }], selectedOcrId: id }))
    return id
  },
  updateOcrImage: (id, updates) =>
    set((s) => ({ ocrImages: s.ocrImages.map((img) => (img.id === id ? { ...img, ...updates } : img)) })),
  removeOcrImage: (id) =>
    set((s) => {
      const ocrImages = s.ocrImages.filter((img) => img.id !== id)
      return { ocrImages, selectedOcrId: s.selectedOcrId === id ? (ocrImages[0]?.id ?? null) : s.selectedOcrId }
    }),
  selectOcrImage: (selectedOcrId) => set({ selectedOcrId })
})

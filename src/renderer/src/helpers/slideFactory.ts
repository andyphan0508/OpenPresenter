import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_TEXT_BLOCK } from '../constants/defaults'
import type { Slide, SlideGroup, Song, SongSection } from '../types'
import { orderedSections } from './arrangement'

export interface GroupItem {
  label?: string
  content: string
  translation?: string
  sectionType?: SongSection
}

export const songItems = (song: Pick<Song, 'slides' | 'arrangements' | 'activeArrangementId'>): GroupItem[] =>
  orderedSections(song).map((s) => ({ label: s.sectionLabel, content: s.content, translation: s.translation, sectionType: s.sectionType }))

export function createBlankSlide(): Slide {
  return {
    id: uuidv4(),
    background: { type: 'color', value: '#000000' },
    textBlocks: [{ ...DEFAULT_TEXT_BLOCK, id: uuidv4() }],
    notes: '',
    transition: 'fade',
    duration: 0
  }
}

// Song / Bible slide: content lives on the slide, look comes from the theme.
export function createThemedSlide(item: GroupItem, group: SlideGroup, themeId: string): Slide {
  const slide = createBlankSlide()
  slide.textBlocks[0].content = item.content
  return { ...slide, group, themeId, label: item.label, sectionType: item.sectionType, translation: item.translation }
}

export function duplicateSlide(slide: Slide): Slide {
  return { ...slide, id: uuidv4(), textBlocks: slide.textBlocks.map((tb) => ({ ...tb, id: uuidv4() })) }
}

export const slideText = (slide?: Slide | null) =>
  slide?.textBlocks.map((b) => b.content).filter(Boolean).join('\n') ?? ''

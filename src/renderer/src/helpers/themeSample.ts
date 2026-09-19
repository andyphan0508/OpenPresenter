import type { Slide } from '../types'
import { createBlankSlide } from './slideFactory'

const SAMPLE_TEXT = 'Chúa là Đấng chăn giữ tôi\nTôi sẽ chẳng thiếu thốn gì'

// Preview slide for theme cards and the theme editor.
export function sampleSlide(themeId: string): Slide {
  const s = createBlankSlide()
  s.textBlocks[0].content = SAMPLE_TEXT
  return { ...s, themeId, translation: 'The Lord is my shepherd', group: { id: 'sample', title: '', kind: 'song' } }
}

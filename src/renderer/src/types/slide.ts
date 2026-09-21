import type { SongSection } from './song'

export type SlideBackground =
  | { type: 'color'; value: string }
  | { type: 'image'; url: string; fit: 'cover' | 'contain' | 'fill' }
  | { type: 'video'; url: string; loop: boolean; muted: boolean }

export interface TextStyle {
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  color: string
  textAlign: 'left' | 'center' | 'right'
  textShadow: boolean
  shadowColor: string
  shadowBlur: number
  lineHeight: number
  textTransform: 'none' | 'uppercase' | 'lowercase'
  outline: boolean
  outlineColor: string
  outlineWidth: number
}

// Position/size in % of the 1920×1080 design canvas.
export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export interface TextBlock extends TextStyle, Box {
  id: string
  content: string
}

export interface AutoAdvance {
  seconds: number
  loop: boolean
}

// A run of consecutive slides that came from one song / Bible passage — one item in the service order.
export interface SlideGroup {
  id: string
  title: string
  kind: 'song' | 'bible' | 'text'
  autoAdvance?: AutoAdvance
  // Came from a weekly program (dashboard): which item, and a signature of what was built from it.
  programItem?: { id: string; sig: string }
}

// 'slide' = push in from the right (ProPresenter "Push").
export type SlideTransition = 'none' | 'fade' | 'slide' | 'zoom'

export interface Slide {
  id: string
  background: SlideBackground
  textBlocks: TextBlock[]
  notes: string
  transition: SlideTransition
  duration: number
  group?: SlideGroup
  label?: string // e.g. "Chorus", "Giăng 3:16"
  sectionType?: SongSection
  translation?: string // second language, rendered under the main text
  themeId?: string // when set, the theme styles text block 0 + background
}

export interface Presentation {
  id: string
  name: string
  slides: Slide[]
  // Synced from a weekly program on the dashboard (see helpers/program.ts).
  program?: { id: string; updatedAt: string }
  createdAt: string
  updatedAt: string
}

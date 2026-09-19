import type { Box, SlideBackground, TextStyle } from './slide'

// Reusable look for song/Bible slides — edit once, every linked slide follows (ProPresenter "Themes").
export interface Theme {
  id: string
  name: string
  background: SlideBackground
  text: TextStyle
  box: Box
  translation: { color: string; scale: number }
}

export interface MediaItem {
  id: string
  name: string
  path: string
  type: 'image' | 'video'
  loop?: boolean // videos play once unless set
}

export type PropPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'

// Image overlay that stays on screen independent of slides (logo, watermark).
export interface Prop {
  id: string
  name: string
  mediaPath: string
  position: PropPosition
  size: number // % of screen width
}

// Text overlay; "{timer}" in text is replaced by the linked timer's time.
export interface Message {
  id: string
  text: string
  target: 'audience' | 'stage' | 'both'
  timerId?: string
}

export interface Timer {
  id: string
  name: string
  mode: 'countdown' | 'toTime' | 'elapsed'
  durationSec: number
  targetTime: string // "HH:MM" for toTime
  running: boolean
  startedAt?: number // epoch ms when (re)started
  accumulatedSec: number // time already counted before the current run
}

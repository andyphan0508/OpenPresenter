import type { Message, Prop, Theme, Timer } from './assets'
import type { Slide, SlideBackground } from './slide'

// Slide text / background visibility (F2 / F3). Props and messages are cleared by emptying them (F4 / F5).
export interface OutputLayers {
  text: boolean
  media: boolean
}

export interface OutputSettings {
  backgroundColor: string
  defaultFontSize: number
  defaultFontFamily: string
  defaultTextColor: string
  defaultTextAlign: 'left' | 'center' | 'right'
  showClock: boolean
  clockPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

// Everything the audience window needs to draw one frame; timers tick locally in that window.
export interface OutputPayload {
  slide: Slide | null
  media: SlideBackground | null
  props: Prop[]
  message: Message | null
  timers: Timer[]
  layers: OutputLayers
  settings: OutputSettings
  themes: Theme[]
}

export interface StagePayload {
  current: { label?: string; text: string } | null
  next: { label?: string; text: string } | null
  groupTitle?: string
  message: Message | null
  timers: Timer[]
}

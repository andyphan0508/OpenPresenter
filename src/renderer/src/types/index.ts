export type SlideBackground =
  | { type: 'color'; value: string }
  | { type: 'image'; url: string; fit: 'cover' | 'contain' | 'fill' }
  | { type: 'video'; url: string; loop: boolean; muted: boolean }

export interface TextBlock {
  id: string
  content: string
  x: number
  y: number
  width: number
  height: number
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

export interface Slide {
  id: string
  background: SlideBackground
  textBlocks: TextBlock[]
  notes: string
  transition: 'none' | 'fade' | 'slide'
  duration: number
}

export interface Presentation {
  id: string
  name: string
  slides: Slide[]
  createdAt: string
  updatedAt: string
}

export type SongSection = 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'tag' | 'pre-chorus'

export interface SongSlide {
  id: string
  sectionType: SongSection
  sectionLabel: string
  content: string
}

export interface Song {
  id: string
  title: string
  author?: string
  category: 'thanh-ca' | 'biet-thanh-ca' | 'tvchh' | 'custom'
  key?: string
  tempo?: number
  tags: string[]
  slides: SongSlide[]
  rawMarkdown: string
  createdAt: string
  updatedAt: string
}

export interface OutputSettings {
  backgroundColor: string
  defaultFontSize: number
  defaultFontFamily: string
  defaultTextColor: string
  defaultTextAlign: 'left' | 'center' | 'right'
  showClock: boolean
  clockPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  targetDisplayId?: number
}

export interface MediaFile {
  id: string
  name: string
  type: 'image' | 'video'
  url: string
  size?: number
  createdAt: string
}

export const DEFAULT_OUTPUT_SETTINGS: OutputSettings = {
  backgroundColor: '#000000',
  defaultFontSize: 72,
  defaultFontFamily: 'sans-serif',
  defaultTextColor: '#ffffff',
  defaultTextAlign: 'center',
  showClock: false,
  clockPosition: 'bottom-right'
}

export const DEFAULT_TEXT_BLOCK: Omit<TextBlock, 'id'> = {
  content: 'Click to edit',
  x: 5,
  y: 20,
  width: 90,
  height: 60,
  fontSize: 72,
  fontFamily: 'sans-serif',
  fontWeight: 'bold',
  fontStyle: 'normal',
  color: '#ffffff',
  textAlign: 'center',
  textShadow: true,
  shadowColor: '#000000',
  shadowBlur: 8,
  lineHeight: 1.3,
  textTransform: 'none',
  outline: false,
  outlineColor: '#000000',
  outlineWidth: 2
}

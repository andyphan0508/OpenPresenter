import type { AppSettings, OutputLayers, OutputSettings, TextBlock, Theme } from '../types'

export const DESIGN_WIDTH = 1920
export const DESIGN_HEIGHT = 1080

export const DEFAULT_OUTPUT_SETTINGS: OutputSettings = {
  backgroundColor: '#000000',
  defaultFontSize: 72,
  defaultFontFamily: 'sans-serif',
  defaultTextColor: '#ffffff',
  defaultTextAlign: 'center',
  showClock: false,
  clockPosition: 'bottom-right'
}

export const ALL_LAYERS_ON: OutputLayers = { text: true, media: true }

export const DEFAULT_TEXT_BLOCK: Omit<TextBlock, 'id'> = {
  content: 'Nhập nội dung',
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

const baseText = (overrides: Partial<Theme['text']> = {}): Theme['text'] => {
  const { content: _c, id: _i, x: _x, y: _y, width: _w, height: _h, ...style } = { ...DEFAULT_TEXT_BLOCK, id: '' }
  return { ...style, lineHeight: 1.4, ...overrides }
}

// Seed themes; ids are stable so settings can reference them.
export const DEFAULT_THEMES: Theme[] = [
  {
    id: 'theme-lyrics',
    name: 'Lời bài hát',
    background: { type: 'color', value: '#000000' },
    text: baseText({ fontSize: 88 }),
    box: { x: 5, y: 10, width: 90, height: 80 },
    translation: { color: '#fde68a', scale: 0.7 }
  },
  {
    id: 'theme-scripture',
    name: 'Kinh Thánh',
    background: { type: 'color', value: '#0b1a2e' },
    text: baseText({ fontSize: 62, fontWeight: 'normal', textAlign: 'left', lineHeight: 1.45 }),
    box: { x: 8, y: 10, width: 84, height: 80 },
    translation: { color: '#93c5fd', scale: 0.75 }
  },
  {
    id: 'theme-lower-third',
    name: 'Lower third (livestream)',
    background: { type: 'color', value: '#000000' },
    text: baseText({ fontSize: 54, textShadow: false, outline: true, outlineWidth: 3 }),
    box: { x: 5, y: 72, width: 90, height: 24 },
    translation: { color: '#e5e7eb', scale: 0.75 }
  }
]

export const DEFAULT_APP_SETTINGS: AppSettings = {
  remoteEnabled: false,
  remotePort: 4316,
  remotePin: String(Math.floor(1000 + Math.random() * 9000)),
  midiEnabled: false,
  midiMappings: [],
  songRepoUrl: '',
  songThemeId: 'theme-lyrics',
  bibleThemeId: 'theme-scripture',
  bibleSecondary: '',
  gridSize: 200,
  decklinkDevice: 0,
  decklinkFormat: 'Hp30',
  decklinkKeyMode: 'luma'
}

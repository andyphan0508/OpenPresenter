import type { KeyMode } from '../../../preload'

export type { KeyMode }

export type RemoteAction =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'goto'; slideId: string }
  | { type: 'clear'; what: ClearTarget }

export type ClearTarget = 'all' | 'text' | 'media' | 'props' | 'messages'

export type MidiActionType = 'next' | 'prev' | `clear:${ClearTarget}`

export interface MidiMapping {
  action: MidiActionType
  note: number
  channel: number
}

export interface AppSettings {
  remoteEnabled: boolean
  remotePort: number
  remotePin: string
  midiEnabled: boolean
  midiMappings: MidiMapping[]
  songRepoUrl: string
  programApiUrl: string
  songThemeId: string
  bibleThemeId: string
  bibleSecondary: '' | 'kjv'
  gridSize: number // slide tile width in px
  decklinkDevice: number
  decklinkFormat: string // DeckLink display-mode FourCC; must match the switcher's video standard
  decklinkKeyMode: KeyMode
}

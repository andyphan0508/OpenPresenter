import type { KeyMode } from '../types'

// Canvas behind the lyrics on the Blackmagic output; undefined = normal audience frame (backgrounds kept).
// Transparent → the device's keyer uses the alpha channel. Black / green → the switcher keys by luma / chroma.
const KEY_BACKGROUND: Record<KeyMode, string | undefined> = {
  external: 'transparent',
  internal: 'transparent',
  luma: '#000000',
  chroma: '#00b140',
  full: undefined
}

export const keyBackground = (mode: string | null): string | undefined => KEY_BACKGROUND[mode as KeyMode]

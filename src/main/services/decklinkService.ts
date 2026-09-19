import { createRequire } from 'module'
import type { DecklinkConfig, DecklinkInfo, DecklinkStatus } from '../../preload'

/**
 * Blackmagic DeckLink / UltraStudio output through the macadam N-API binding.
 * We load the .node file directly (not macadam's index.js) so no Electron rebuild is needed.
 * Requires Blackmagic Desktop Video installed, then `npm run setup:blackmagic` (builds it for Electron).
 */

// fps = how often the offscreen page repaints (interlaced modes carry 25/29.97 frames per second).
export const FORMATS = [
  { id: 'Hp25', label: '1080p25', fps: 25 },
  { id: 'Hp29', label: '1080p29.97', fps: 30 },
  { id: 'Hp30', label: '1080p30', fps: 30 },
  { id: 'Hp50', label: '1080p50', fps: 50 },
  { id: 'Hp59', label: '1080p59.94', fps: 60 },
  { id: 'Hp60', label: '1080p60', fps: 60 },
  { id: 'Hi50', label: '1080i50', fps: 25 },
  { id: 'Hi59', label: '1080i59.94', fps: 30 },
  { id: 'hp50', label: '720p50', fps: 50 },
  { id: 'hp59', label: '720p59.94', fps: 60 },
  { id: 'hp60', label: '720p60', fps: 60 }
]

export const fourCC = (s: string) => Buffer.from(s).readUInt32BE(0)

interface Playback {
  width: number
  height: number
  displayFrame(frame: Buffer): Promise<void>
  stop(): void
}

interface Macadam {
  getDeviceInfo(): { modelName?: string; displayName?: string; supportsExternalKeying?: boolean; supportsInternalKeying?: boolean }[]
  playback(opts: Record<string, unknown>): Promise<Playback>
}

let lib: Macadam | null = null
let loadError = ''
let playback: Playback | null = null
let status: DecklinkStatus = { running: false }

const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

function native(): Macadam | null {
  if (lib || loadError) return lib
  try {
    lib = createRequire(__filename)('macadam/build/Release/macadam.node') as Macadam
  } catch (e) {
    loadError = message(e)
  }
  return lib
}

export function decklinkInfo(): DecklinkInfo {
  const formats = FORMATS.map(({ id, label }) => ({ id, label }))
  const m = native()
  if (!m) return { ...status, available: false, error: loadError, devices: [], formats }
  try {
    const devices = m.getDeviceInfo().map((d, index) => ({
      index,
      name: d.displayName || d.modelName || `Thiết bị ${index + 1}`,
      externalKeying: !!d.supportsExternalKeying,
      internalKeying: !!d.supportsInternalKeying
    }))
    return { ...status, available: true, devices, formats }
  } catch (e) {
    return { ...status, available: true, error: message(e), devices: [], formats }
  }
}

export async function openPlayback(cfg: DecklinkConfig): Promise<Playback> {
  const m = native()
  if (!m) throw new Error(loadError)
  closePlayback()
  const keying = cfg.keyMode === 'external' || cfg.keyMode === 'internal'
  playback = await m.playback({
    deviceIndex: cfg.deviceIndex,
    displayMode: fourCC(cfg.format),
    pixelFormat: fourCC('BGRA'),
    enableKeying: keying,
    isExternal: cfg.keyMode === 'external'
  })
  status = { running: true }
  return playback
}

export function closePlayback(): void {
  try {
    playback?.stop()
  } catch {
    // device already gone (cable pulled) — nothing left to release
  }
  playback = null
  status = { running: false }
}

export function setDecklinkError(error: string): DecklinkStatus {
  status = { running: false, error }
  return status
}

export const decklinkStatus = () => status

// Sync output: the device keeps showing the last frame, so we only push when the page repaints.
// While a frame is in flight only the newest one is kept; older ones are dropped.
let busy = false
let pending: Buffer | null = null

export async function pushFrame(frame: Buffer): Promise<void> {
  if (busy) {
    pending = frame
    return
  }
  busy = true
  try {
    await playback?.displayFrame(frame)
  } catch (e) {
    console.error('[decklink] displayFrame', message(e))
  }
  busy = false
  if (pending) {
    const next = pending
    pending = null
    void pushFrame(next)
  }
}

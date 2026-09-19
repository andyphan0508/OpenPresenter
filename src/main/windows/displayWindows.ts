import { BrowserWindow, screen } from 'electron'
import { getMainWindow } from './mainWindow'
import { loadRenderer, preloadPath } from './loadRenderer'

// keyer = hidden offscreen output feeding a Blackmagic device (see keyerWindow.ts).
export type DisplayKind = 'output' | 'stage' | 'keyer'

const windows: Record<DisplayKind, BrowserWindow | null> = { output: null, stage: null, keyer: null }
// Last message per window+channel, replayed when that window reports ready so it never starts blank.
const lastSent = new Map<string, { kind: DisplayKind; channel: string; data: unknown }>()

export const isDisplayOpen = (kind: DisplayKind) => !!windows[kind] && !windows[kind]!.isDestroyed()

export function sendToDisplay(kind: DisplayKind, channel: string, data: unknown): void {
  lastSent.set(`${kind}:${channel}`, { kind, channel, data })
  if (isDisplayOpen(kind)) windows[kind]!.webContents.send(channel, data)
}

export function replayDisplay(kind: DisplayKind): void {
  if (!isDisplayOpen(kind)) return
  for (const m of lastSent.values()) if (m.kind === kind) windows[kind]!.webContents.send(m.channel, m.data)
}

export function attachDisplay(kind: DisplayKind, win: BrowserWindow): void {
  windows[kind] = win
  win.on('closed', () => {
    if (windows[kind] === win) windows[kind] = null
  })
}

function createDisplayWindow(kind: DisplayKind): BrowserWindow {
  const displays = screen.getAllDisplays()
  const external = displays.filter((d) => d.bounds.x !== 0 || d.bounds.y !== 0)
  // Output: first external screen (or cover the primary). Stage: second external screen, else a normal window.
  const target = kind === 'output' ? external[0] || displays[0] : external[1]

  const win = new BrowserWindow({
    ...(target ? target.bounds : { width: 960, height: 540 }),
    title: kind === 'stage' ? 'Stage Display' : 'Output',
    show: false,
    backgroundColor: '#000000',
    frame: !target,
    webPreferences: { preload: preloadPath(), sandbox: false, contextIsolation: true }
  })
  win.on('ready-to-show', () => win.show())
  win.on('closed', () => {
    windows[kind] = null
    getMainWindow()?.webContents.send('display-changed', kind, false)
  })
  loadRenderer(win, kind)
  return win
}

export function toggleDisplay(kind: DisplayKind): boolean {
  if (isDisplayOpen(kind)) {
    windows[kind]!.close()
    return false
  }
  windows[kind] = createDisplayWindow(kind)
  getMainWindow()?.webContents.send('display-changed', kind, true)
  return true
}

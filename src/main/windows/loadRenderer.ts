import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export const preloadPath = () => join(__dirname, '../preload/index.js')

// Same renderer bundle for every window; `?view=` picks the root component.
export function loadRenderer(win: BrowserWindow, view?: string, extra: Record<string, string> = {}): void {
  const query: Record<string, string> = view ? { view, ...extra } : {}
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const qs = new URLSearchParams(query).toString()
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + (qs ? `?${qs}` : ''))
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), view ? { query } : undefined)
  }
}

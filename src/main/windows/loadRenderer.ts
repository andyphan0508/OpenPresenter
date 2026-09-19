import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export const preloadPath = () => join(__dirname, '../preload/index.js')

// Same renderer bundle for every window; `?view=` picks the root component.
export function loadRenderer(win: BrowserWindow, view?: string): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + (view ? `?view=${view}` : ''))
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), view ? { query: { view } } : undefined)
  }
}

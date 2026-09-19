import { BrowserWindow, shell } from 'electron'
import { loadRenderer, preloadPath } from './loadRenderer'

let mainWindow: BrowserWindow | null = null

export const getMainWindow = () => (mainWindow && !mainWindow.isDestroyed() ? mainWindow : null)

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 720,
    show: false,
    backgroundColor: '#161616',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    webPreferences: { preload: preloadPath(), sandbox: false, contextIsolation: true }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler((details) => {
    if (/^https?:/.test(details.url)) shell.openExternal(details.url)
    return { action: 'deny' }
  })

  loadRenderer(win)
  mainWindow = win
  return win
}

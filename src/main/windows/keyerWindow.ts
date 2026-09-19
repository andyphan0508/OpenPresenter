import { BrowserWindow, screen } from 'electron'
import { attachDisplay } from './displayWindows'
import { loadRenderer, preloadPath } from './loadRenderer'

let win: BrowserWindow | null = null

// Hidden offscreen copy of the audience output; every repaint is handed to the video device as BGRA.
export function openKeyerWindow(width: number, height: number, fps: number, keyMode: string, onFrame: (bgra: Buffer) => void): void {
  closeKeyerWindow()
  // Offscreen pages paint at the primary display's scale (2× on Retina): size the page so pixels = video size.
  const scale = screen.getPrimaryDisplay().scaleFactor
  win = new BrowserWindow({
    width: Math.round(width / scale),
    height: Math.round(height / scale),
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: { preload: preloadPath(), sandbox: false, contextIsolation: true, offscreen: true, backgroundThrottling: false }
  })
  win.webContents.setFrameRate(fps)
  win.webContents.on('paint', (_e, _dirty, image) => {
    // Fallback for fractional scales where the rounding above misses by a pixel.
    const { width: w, height: h } = image.getSize()
    onFrame((w === width && h === height ? image : image.resize({ width, height, quality: 'best' })).toBitmap())
  })
  attachDisplay('keyer', win)
  loadRenderer(win, 'keyer', { key: keyMode })
}

export function closeKeyerWindow(): void {
  if (win && !win.isDestroyed()) win.destroy()
  win = null
}

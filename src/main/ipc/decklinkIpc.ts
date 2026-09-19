import { ipcMain } from 'electron'
import type { DecklinkConfig } from '../../preload'
import {
  closePlayback,
  decklinkInfo,
  decklinkStatus,
  FORMATS,
  openPlayback,
  pushFrame,
  setDecklinkError
} from '../services/decklinkService'
import { closeKeyerWindow, openKeyerWindow } from '../windows/keyerWindow'

const KEY_MODES = new Set(['external', 'internal', 'luma', 'chroma', 'full'])

export function stopDecklink() {
  closeKeyerWindow()
  closePlayback()
  return decklinkStatus()
}

async function startDecklink(cfg: DecklinkConfig) {
  const format = FORMATS.find((f) => f.id === cfg?.format)
  if (!format || !KEY_MODES.has(cfg.keyMode) || !Number.isInteger(cfg.deviceIndex) || cfg.deviceIndex < 0) {
    return setDecklinkError('Cấu hình không hợp lệ')
  }
  stopDecklink()
  try {
    const pb = await openPlayback(cfg)
    openKeyerWindow(pb.width, pb.height, format.fps, cfg.keyMode, pushFrame)
    return decklinkStatus()
  } catch (e) {
    closePlayback()
    return setDecklinkError(e instanceof Error ? e.message : String(e))
  }
}

export function registerDecklinkIpc(): void {
  ipcMain.handle('decklink:info', () => decklinkInfo())
  ipcMain.handle('decklink:start', (_e, cfg: DecklinkConfig) => startDecklink(cfg))
  ipcMain.handle('decklink:stop', () => stopDecklink())
}

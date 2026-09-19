import { ipcMain } from 'electron'
import { isDisplayOpen, replayDisplay, sendToDisplay, toggleDisplay, type DisplayKind } from '../windows/displayWindows'

const isKind = (k: unknown): k is DisplayKind => k === 'output' || k === 'stage'
const isAnyKind = (k: unknown): k is DisplayKind => isKind(k) || k === 'keyer'

export function registerDisplayIpc(): void {
  ipcMain.handle('display:toggle', (_e, kind) => (isKind(kind) ? toggleDisplay(kind) : false))
  ipcMain.handle('display:is-open', (_e, kind) => isKind(kind) && isDisplayOpen(kind))
  // A display window sends this once its listeners exist; it then gets the latest frame.
  ipcMain.on('display:ready', (_e, kind) => isAnyKind(kind) && replayDisplay(kind))
  ipcMain.on('display:output', (_e, payload) => {
    sendToDisplay('output', 'output:payload', payload)
    sendToDisplay('keyer', 'output:payload', payload)
  })
  ipcMain.on('display:stage', (_e, payload) => sendToDisplay('stage', 'stage:payload', payload))
}

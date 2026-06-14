import { ipcMain, dialog, app } from 'electron'
import { BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'

interface IPCContext {
  getMainWindow: () => BrowserWindow | null
  getOutputWindow: () => BrowserWindow | null
  createOutput: () => void
  closeOutput: () => void
  isOutputOpen: () => boolean
}

export function setupIPC(ctx: IPCContext): void {
  // Output window management
  ipcMain.handle('toggle-output', () => {
    if (ctx.isOutputOpen()) {
      ctx.closeOutput()
      return false
    } else {
      ctx.createOutput()
      return true
    }
  })

  ipcMain.handle('get-output-state', () => ctx.isOutputOpen())

  // Send slide data to output window
  ipcMain.on('show-slide', (_event, slideData) => {
    const output = ctx.getOutputWindow()
    if (output && !output.isDestroyed()) {
      output.webContents.send('display-slide', slideData)
    }
  })

  ipcMain.on('clear-output', () => {
    const output = ctx.getOutputWindow()
    if (output && !output.isDestroyed()) {
      output.webContents.send('display-slide', null)
    }
  })

  // File operations
  ipcMain.handle('open-file-dialog', async (_event, options) => {
    const win = ctx.getMainWindow()
    const opts = {
      title: options?.title,
      properties: ['openFile' as const],
      filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }]
    }
    const result = win
      ? await dialog.showOpenDialog(win, opts)
      : await dialog.showOpenDialog(opts)
    return result
  })

  ipcMain.handle('save-file-dialog', async (_event, options) => {
    const win = ctx.getMainWindow()
    const opts = {
      title: options?.title,
      defaultPath: options?.defaultPath,
      filters: options?.filters || [{ name: 'JSON', extensions: ['json'] }]
    }
    const result = win
      ? await dialog.showSaveDialog(win, opts)
      : await dialog.showSaveDialog(opts)
    return result
  })

  ipcMain.handle('read-file', async (_event, filePath: string) => {
    try {
      const content = fs.readFileSync(filePath)
      return { success: true, data: content.toString('base64'), path: filePath }
    } catch (e: unknown) {
      const err = e as Error
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('write-file', async (_event, filePath: string, data: string) => {
    try {
      fs.writeFileSync(filePath, data, 'utf-8')
      return { success: true }
    } catch (e: unknown) {
      const err = e as Error
      return { success: false, error: err.message }
    }
  })

  // Database path
  ipcMain.handle('get-user-data-path', () => app.getPath('userData'))

  // Output settings sync
  ipcMain.on('update-output-settings', (_event, settings) => {
    const output = ctx.getOutputWindow()
    if (output && !output.isDestroyed()) {
      output.webContents.send('output-settings-changed', settings)
    }
  })

  // Fullscreen toggle for output
  ipcMain.on('set-output-fullscreen', (_event, fullscreen: boolean) => {
    const output = ctx.getOutputWindow()
    if (output && !output.isDestroyed()) {
      output.setFullScreen(fullscreen)
    }
  })
}

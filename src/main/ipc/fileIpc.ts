import { dialog, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { MEDIA_EXTENSIONS } from '../services/mediaProtocol'

type Filter = { name: string; extensions: string[] }
const MAX_TEXT_BYTES = 20 * 1024 * 1024
const VIDEO = new Set(['mp4', 'm4v', 'mov', 'webm'])

// The renderer can only touch files the user picked in a native dialog.
export function registerFileIpc(): void {
  ipcMain.handle('file:open-text', async (_e, filters: Filter[], multiple: boolean) => {
    const res = await dialog.showOpenDialog({ filters, properties: multiple ? ['openFile', 'multiSelections'] : ['openFile'] })
    if (res.canceled) return []
    return res.filePaths
      .filter((p) => fs.statSync(p).size <= MAX_TEXT_BYTES)
      .map((p) => ({ name: path.basename(p), content: fs.readFileSync(p, 'utf-8') }))
  })

  ipcMain.handle('file:save-text', async (_e, defaultName: string, content: string, filters: Filter[]) => {
    const res = await dialog.showSaveDialog({ defaultPath: defaultName, filters })
    if (res.canceled || !res.filePath) return null
    fs.writeFileSync(res.filePath, String(content), 'utf-8')
    return res.filePath
  })

  ipcMain.handle('file:pick-media', async (_e, imagesOnly: boolean) => {
    const extensions = imagesOnly ? MEDIA_EXTENSIONS.filter((e) => !VIDEO.has(e)) : MEDIA_EXTENSIONS
    const res = await dialog.showOpenDialog({
      filters: [{ name: imagesOnly ? 'Ảnh' : 'Ảnh & video', extensions }],
      properties: ['openFile', 'multiSelections']
    })
    if (res.canceled) return []
    return res.filePaths.map((p) => ({
      path: p,
      name: path.basename(p, path.extname(p)),
      type: VIDEO.has(path.extname(p).slice(1).toLowerCase()) ? 'video' : 'image'
    }))
  })
}

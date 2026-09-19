import { ipcMain } from 'electron'
import { loadData, saveData } from '../services/storageService'

export function registerStorageIpc(): void {
  ipcMain.handle('storage:load', () => loadData())
  // Sync so the final save on window close completes before the renderer goes away.
  ipcMain.on('storage:save', (event, json: string) => {
    event.returnValue = typeof json === 'string' && saveData(json)
  })
}

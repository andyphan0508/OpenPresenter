import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // Output window
  toggleOutput: () => ipcRenderer.invoke('toggle-output'),
  getOutputState: () => ipcRenderer.invoke('get-output-state'),
  showSlide: (slideData: unknown) => ipcRenderer.send('show-slide', slideData),
  clearOutput: () => ipcRenderer.send('clear-output'),
  setOutputFullscreen: (fullscreen: boolean) =>
    ipcRenderer.send('set-output-fullscreen', fullscreen),
  updateOutputSettings: (settings: unknown) =>
    ipcRenderer.send('update-output-settings', settings),

  // Display enumeration
  getDisplays: () => ipcRenderer.invoke('get-displays'),

  // File operations
  openFileDialog: (options?: unknown) => ipcRenderer.invoke('open-file-dialog', options),
  saveFileDialog: (options?: unknown) => ipcRenderer.invoke('save-file-dialog', options),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, data: string) => ipcRenderer.invoke('write-file', filePath, data),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

  // Listeners
  onDisplaySlide: (callback: (data: unknown) => void) => {
    ipcRenderer.on('display-slide', (_event, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('display-slide')
  },
  onOutputSettingsChanged: (callback: (settings: unknown) => void) => {
    ipcRenderer.on('output-settings-changed', (_event, settings) => callback(settings))
    return () => ipcRenderer.removeAllListeners('output-settings-changed')
  },
  onOutputWindowOpened: (callback: () => void) => {
    ipcRenderer.on('output-window-opened', () => callback())
    return () => ipcRenderer.removeAllListeners('output-window-opened')
  },
  onOutputWindowClosed: (callback: () => void) => {
    ipcRenderer.on('output-window-closed', () => callback())
    return () => ipcRenderer.removeAllListeners('output-window-closed')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}

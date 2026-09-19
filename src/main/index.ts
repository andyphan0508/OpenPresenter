import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { registerBibleIpc } from './ipc/bibleIpc'
import { registerDisplayIpc } from './ipc/displayIpc'
import { registerFileIpc } from './ipc/fileIpc'
import { registerNetIpc } from './ipc/netIpc'
import { registerRemoteIpc } from './ipc/remoteIpc'
import { registerStorageIpc } from './ipc/storageIpc'
import { handleMediaProtocol, registerMediaScheme } from './services/mediaProtocol'
import { stopRemote } from './services/remoteServer'
import { createMainWindow } from './windows/mainWindow'

registerMediaScheme()

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.openpresenter')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  handleMediaProtocol()
  registerStorageIpc()
  registerDisplayIpc()
  registerBibleIpc()
  registerFileIpc()
  registerNetIpc()
  registerRemoteIpc()

  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  stopRemote()
  if (process.platform !== 'darwin') app.quit()
})

import { ipcMain } from 'electron'
import { publishRemoteState, remoteStatus, startRemote, stopRemote } from '../services/remoteServer'
import { getMainWindow } from '../windows/mainWindow'

export function registerRemoteIpc(): void {
  ipcMain.handle('remote:configure', (_e, enabled: boolean, port: number, pin: string) => {
    if (!enabled) {
      stopRemote()
      return remoteStatus()
    }
    // Actions from phones are executed by the main window, which owns the show state.
    return startRemote(Number(port), String(pin), (action) => getMainWindow()?.webContents.send('remote:action', action))
  })
  ipcMain.handle('remote:status', () => remoteStatus())
  ipcMain.on('remote:publish', (_e, state) => publishRemoteState(state))
}

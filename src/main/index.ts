import { app, shell, BrowserWindow, ipcMain, screen, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { setupIPC } from './ipc'

let mainWindow: BrowserWindow | null = null
let outputWindow: BrowserWindow | null = null

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: '#1a1a1a',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function createOutputWindow(): BrowserWindow {
  const displays = screen.getAllDisplays()
  const externalDisplay = displays.find((d) => d.bounds.x !== 0 || d.bounds.y !== 0)
  const targetDisplay = externalDisplay || displays[0]

  const win = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    show: false,
    backgroundColor: '#000000',
    frame: false,
    alwaysOnTop: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?output=true')
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { output: 'true' }
    })
  }

  return win
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.openpresenter')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  mainWindow = createMainWindow()

  setupIPC({
    getMainWindow: () => mainWindow,
    getOutputWindow: () => outputWindow,
    createOutput: () => {
      if (!outputWindow || outputWindow.isDestroyed()) {
        outputWindow = createOutputWindow()
        outputWindow.on('closed', () => {
          outputWindow = null
          mainWindow?.webContents.send('output-window-closed')
        })
        mainWindow?.webContents.send('output-window-opened')
      }
    },
    closeOutput: () => {
      if (outputWindow && !outputWindow.isDestroyed()) {
        outputWindow.close()
        outputWindow = null
      }
    },
    isOutputOpen: () => !!outputWindow && !outputWindow.isDestroyed()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

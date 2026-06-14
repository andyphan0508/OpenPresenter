import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { setupIPC } from './ipc'
import { buildAppMenu } from './menu'

let mainWindow: BrowserWindow | null = null
let outputWindow: BrowserWindow | null = null

// Path of a .opres file the OS asked us to open (double-click / "Open with").
// Held until the renderer signals it is ready to receive it.
let pendingOpenFile: string | null = null
let rendererReady = false

const PROJECT_EXT = '.opres'

/** Pick the first .opres path out of a process argv array, if any. */
function projectPathFromArgv(argv: string[]): string | null {
  const found = argv.find((a) => a.toLowerCase().endsWith(PROJECT_EXT))
  return found || null
}

function deliverOpenFile(filePath: string): void {
  pendingOpenFile = filePath
  if (rendererReady && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('open-project-file', filePath)
    pendingOpenFile = null
    mainWindow.focus()
  }
}

// macOS delivers file-open requests via this event (can fire before app is ready).
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  deliverOpenFile(filePath)
})

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

// Ensure a single instance so file-association opens reuse the running app.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const filePath = projectPathFromArgv(argv)
    if (filePath) deliverOpenFile(filePath)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.openpresenter')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // On Windows/Linux the file path arrives as a launch argument.
  if (process.platform !== 'darwin' && !pendingOpenFile) {
    const fromArgv = projectPathFromArgv(process.argv)
    if (fromArgv) pendingOpenFile = fromArgv
  }

  mainWindow = createMainWindow()
  buildAppMenu(() => mainWindow)

  // The renderer tells us when it can accept an open-file request.
  ipcMain.on('renderer-ready', () => {
    rendererReady = true
    if (pendingOpenFile) deliverOpenFile(pendingOpenFile)
  })

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

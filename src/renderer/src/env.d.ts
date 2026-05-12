/// <reference types="vite/client" />

import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      toggleOutput: () => Promise<boolean>
      getOutputState: () => Promise<boolean>
      showSlide: (slideData: unknown) => void
      clearOutput: () => void
      setOutputFullscreen: (fullscreen: boolean) => void
      updateOutputSettings: (settings: unknown) => void
      openFileDialog: (options?: unknown) => Promise<{ canceled: boolean; filePaths: string[] }>
      saveFileDialog: (options?: unknown) => Promise<{ canceled: boolean; filePath?: string }>
      readFile: (filePath: string) => Promise<{ success: boolean; data?: string; path?: string; error?: string }>
      writeFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>
      getUserDataPath: () => Promise<string>
      onDisplaySlide: (callback: (data: unknown) => void) => () => void
      onOutputSettingsChanged: (callback: (settings: unknown) => void) => () => void
      onOutputWindowOpened: (callback: () => void) => () => void
      onOutputWindowClosed: (callback: () => void) => () => void
    }
  }
}

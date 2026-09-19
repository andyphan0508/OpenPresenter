import { contextBridge, ipcRenderer } from 'electron'

type Kind = 'output' | 'stage'
type Filter = { name: string; extensions: string[] }

// Subscribe helper returning an unsubscribe function.
const on = <T extends unknown[]>(channel: string, cb: (...args: T) => void) => {
  const listener = (_e: Electron.IpcRendererEvent, ...args: unknown[]) => cb(...(args as T))
  ipcRenderer.on(channel, listener)
  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

const api = {
  display: {
    toggle: (kind: Kind): Promise<boolean> => ipcRenderer.invoke('display:toggle', kind),
    isOpen: (kind: Kind): Promise<boolean> => ipcRenderer.invoke('display:is-open', kind),
    ready: (kind: Kind) => ipcRenderer.send('display:ready', kind),
    sendOutput: (payload: unknown) => ipcRenderer.send('display:output', payload),
    sendStage: (payload: unknown) => ipcRenderer.send('display:stage', payload),
    onOutput: (cb: (payload: unknown) => void) => on('output:payload', cb),
    onStage: (cb: (payload: unknown) => void) => on('stage:payload', cb),
    onChanged: (cb: (kind: Kind, open: boolean) => void) => on('display-changed', cb)
  },
  storage: {
    load: (): Promise<string | null> => ipcRenderer.invoke('storage:load'),
    save: (json: string): boolean => ipcRenderer.sendSync('storage:save', json)
  },
  bible: {
    chapterCounts: (version: string): Promise<Record<string, number>> => ipcRenderer.invoke('bible:chapter-counts', version),
    chapter: (version: string, book: string, n: number): Promise<string[]> => ipcRenderer.invoke('bible:chapter', version, book, n)
  },
  files: {
    openText: (filters: Filter[], multiple = false): Promise<{ name: string; content: string }[]> =>
      ipcRenderer.invoke('file:open-text', filters, multiple),
    saveText: (defaultName: string, content: string, filters: Filter[]): Promise<string | null> =>
      ipcRenderer.invoke('file:save-text', defaultName, content, filters),
    pickMedia: (imagesOnly = false): Promise<{ path: string; name: string; type: 'image' | 'video' }[]> =>
      ipcRenderer.invoke('file:pick-media', imagesOnly)
  },
  net: {
    fetchText: (url: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> =>
      ipcRenderer.invoke('net:fetch-text', url)
  },
  remote: {
    configure: (enabled: boolean, port: number, pin: string): Promise<RemoteStatus> =>
      ipcRenderer.invoke('remote:configure', enabled, port, pin),
    status: (): Promise<RemoteStatus> => ipcRenderer.invoke('remote:status'),
    publish: (state: unknown) => ipcRenderer.send('remote:publish', state),
    onAction: (cb: (action: unknown) => void) => on('remote:action', cb)
  }
}

export interface RemoteStatus {
  running: boolean
  urls: string[]
  error?: string
}

export type OpenPresenterApi = typeof api

contextBridge.exposeInMainWorld('api', api)

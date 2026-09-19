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
    ready: (kind: Kind | 'keyer') => ipcRenderer.send('display:ready', kind),
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
  },
  decklink: {
    info: (): Promise<DecklinkInfo> => ipcRenderer.invoke('decklink:info'),
    start: (cfg: DecklinkConfig): Promise<DecklinkStatus> => ipcRenderer.invoke('decklink:start', cfg),
    stop: (): Promise<DecklinkStatus> => ipcRenderer.invoke('decklink:stop')
  }
}

export interface RemoteStatus {
  running: boolean
  urls: string[]
  error?: string
}

// external = fill + key on two SDI outs (ATEM DSK), internal = device keys over its SDI input,
// luma / chroma = lyrics on black / green for a luma or chroma key (ATEM USK/DSK), full = normal output.
export type KeyMode = 'external' | 'internal' | 'luma' | 'chroma' | 'full'

export interface DecklinkConfig {
  deviceIndex: number
  format: string // DeckLink display-mode FourCC, e.g. 'Hp30'
  keyMode: KeyMode
}

export interface DecklinkDevice {
  index: number
  name: string
  externalKeying: boolean
  internalKeying: boolean
}

export interface DecklinkStatus {
  running: boolean
  error?: string
}

export interface DecklinkInfo extends DecklinkStatus {
  available: boolean
  devices: DecklinkDevice[]
  formats: { id: string; label: string }[]
}

export type OpenPresenterApi = typeof api

contextBridge.exposeInMainWorld('api', api)

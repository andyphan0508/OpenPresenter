import type { RemoteAction } from '../types'

export interface RemoteStatus {
  running: boolean
  urls: string[]
  error?: string
}

// What phones (and the OBS lower-third page) receive.
export interface RemoteState {
  presentation: string | null
  items: { title: string; kind: string; slides: { id: string; label?: string; text: string }[] }[]
  liveSlideId: string | null
  live: { label?: string; text: string; translation?: string } | null
  layers: { text: boolean; media: boolean }
}

export const configureRemote = (enabled: boolean, port: number, pin: string): Promise<RemoteStatus> =>
  window.api.remote.configure(enabled, port, pin)
export const getRemoteStatus = (): Promise<RemoteStatus> => window.api.remote.status()
export const publishRemoteState = (state: RemoteState) => window.api.remote.publish(state)
export const onRemoteAction = (cb: (action: RemoteAction) => void) =>
  window.api.remote.onAction((a) => cb(a as RemoteAction))

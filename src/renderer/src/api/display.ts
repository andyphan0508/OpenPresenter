import type { OutputPayload, StagePayload } from '../types'

export type DisplayKind = 'output' | 'stage'

export const toggleDisplay = (kind: DisplayKind) => window.api.display.toggle(kind)
export const isDisplayOpen = (kind: DisplayKind) => window.api.display.isOpen(kind)
export const onDisplayChanged = (cb: (kind: DisplayKind, open: boolean) => void) => window.api.display.onChanged(cb)

export const sendOutput = (payload: OutputPayload) => window.api.display.sendOutput(payload)
export const sendStage = (payload: StagePayload) => window.api.display.sendStage(payload)

// Display-window side: subscribe, then tell main we're ready to receive the latest frame.
export function subscribeOutput(cb: (payload: OutputPayload) => void) {
  const off = window.api.display.onOutput((p) => cb(p as OutputPayload))
  window.api.display.ready('output')
  return off
}

export function subscribeStage(cb: (payload: StagePayload) => void) {
  const off = window.api.display.onStage((p) => cb(p as StagePayload))
  window.api.display.ready('stage')
  return off
}

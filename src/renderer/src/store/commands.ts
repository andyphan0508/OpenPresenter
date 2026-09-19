import type { ClearTarget, MidiActionType, RemoteAction } from '../types'
import { useStore } from './index'

// One entry point for show commands coming from keyboard, phone remote or MIDI.
export function runShowCommand(action: RemoteAction): void {
  const s = useStore.getState()
  switch (action.type) {
    case 'next': return s.goNext()
    case 'prev': return s.goPrev()
    case 'goto': return s.goLive(action.slideId)
    case 'clear': return s.clear(action.what)
  }
}

export function runMidiAction(action: MidiActionType): void {
  if (action === 'next' || action === 'prev') return runShowCommand({ type: action })
  runShowCommand({ type: 'clear', what: action.slice('clear:'.length) as ClearTarget })
}

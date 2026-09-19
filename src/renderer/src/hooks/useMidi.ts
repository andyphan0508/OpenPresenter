import { useEffect } from 'react'
import { useStore } from '../store'
import { runMidiAction } from '../store/commands'

type NoteHandler = (note: number, channel: number) => void

// Calls `handler` for every note-on from any connected MIDI input (Web MIDI API, built into Chromium).
export function listenMidiNotes(handler: NoteHandler): () => void {
  let access: MIDIAccess | null = null
  let stopped = false
  const onMessage = (e: MIDIMessageEvent) => {
    const [status, note, velocity] = e.data ?? []
    if ((status & 0xf0) === 0x90 && velocity > 0) handler(note, status & 0x0f)
  }
  const attach = () => access?.inputs.forEach((input) => (input.onmidimessage = onMessage))

  navigator.requestMIDIAccess?.().then((a) => {
    if (stopped) return
    access = a
    attach()
    a.onstatechange = attach // devices plugged in later
  }).catch((e) => console.warn('MIDI unavailable:', e))

  return () => {
    stopped = true
    access?.inputs.forEach((input) => (input.onmidimessage = null))
    if (access) access.onstatechange = null
  }
}

// Maps learned notes to show commands (e.g. a foot pedal for "next slide").
export function useMidi(): void {
  const { midiEnabled, midiMappings } = useStore((s) => s.settings)
  useEffect(() => {
    if (!midiEnabled || midiMappings.length === 0) return
    return listenMidiNotes((note, channel) => {
      const m = midiMappings.find((x) => x.note === note && x.channel === channel)
      if (m) runMidiAction(m.action)
    })
  }, [midiEnabled, midiMappings])
}

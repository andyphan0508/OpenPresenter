import { v4 as uuidv4 } from 'uuid'
import { pauseTimer, resetTimer, startTimer } from '../../helpers/timer'
import type { Message, Timer } from '../../types'
import type { SliceCreator } from '../types'

// Show controls: messages and timers.
export interface ControlsSlice {
  messages: Message[]
  timers: Timer[]

  addMessage: () => string
  updateMessage: (id: string, updates: Partial<Message>) => void
  deleteMessage: (id: string) => void

  addTimer: () => string
  updateTimer: (id: string, updates: Partial<Timer>) => void
  deleteTimer: (id: string) => void
  timerCommand: (id: string, command: 'start' | 'pause' | 'reset') => void
}

const DEFAULT_TIMER: Omit<Timer, 'id'> = {
  name: 'Đếm ngược',
  mode: 'countdown',
  durationSec: 300,
  targetTime: '09:00',
  running: false,
  accumulatedSec: 0
}

export const createControlsSlice: SliceCreator<ControlsSlice> = (set) => ({
  messages: [{ id: 'msg-welcome', text: 'Chào mừng quý vị đến thờ phượng Chúa', target: 'audience' }],
  timers: [{ ...DEFAULT_TIMER, id: 'timer-service', name: 'Trước giờ nhóm' }],

  addMessage: () => {
    const id = uuidv4()
    set((s) => ({ messages: [...s.messages, { id, text: 'Tin nhắn mới', target: 'audience' }] }))
    return id
  },

  updateMessage: (id, updates) => set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),

  deleteMessage: (id) =>
    set((s) => ({
      messages: s.messages.filter((m) => m.id !== id),
      activeMessageId: s.activeMessageId === id ? null : s.activeMessageId
    })),

  addTimer: () => {
    const id = uuidv4()
    set((s) => ({ timers: [...s.timers, { ...DEFAULT_TIMER, id }] }))
    return id
  },

  updateTimer: (id, updates) => set((s) => ({ timers: s.timers.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

  deleteTimer: (id) => set((s) => ({ timers: s.timers.filter((t) => t.id !== id) })),

  timerCommand: (id, command) => {
    const now = Date.now()
    const apply = command === 'start' ? (t: Timer) => startTimer(t, now) : command === 'pause' ? (t: Timer) => pauseTimer(t, now) : resetTimer
    set((s) => ({ timers: s.timers.map((t) => (t.id === id ? apply(t) : t)) }))
  }
})

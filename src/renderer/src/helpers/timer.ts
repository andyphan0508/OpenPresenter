import type { Message, Timer } from '../types'

// Seconds to show right now: remaining for countdowns, elapsed for stopwatches.
export function timerSeconds(timer: Timer, now: number): number {
  const runSec = timer.running && timer.startedAt !== undefined ? (now - timer.startedAt) / 1000 : 0
  const elapsed = timer.accumulatedSec + runSec
  if (timer.mode === 'elapsed') return elapsed
  if (timer.mode === 'countdown') return timer.durationSec - elapsed
  const [h, m] = timer.targetTime.split(':').map(Number)
  const target = new Date(now)
  target.setHours(h || 0, m || 0, 0, 0)
  return (target.getTime() - now) / 1000
}

export function formatSeconds(sec: number): string {
  const sign = sec < 0 ? '-' : ''
  const s = Math.abs(Math.round(sec))
  const h = Math.floor(s / 3600)
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${sign}${h ? `${h}:` : ''}${mm}:${ss}`
}

export function startTimer(timer: Timer, now: number): Timer {
  return timer.running ? timer : { ...timer, running: true, startedAt: now }
}

export function pauseTimer(timer: Timer, now: number): Timer {
  if (!timer.running || timer.startedAt === undefined) return timer
  return { ...timer, running: false, startedAt: undefined, accumulatedSec: timer.accumulatedSec + (now - timer.startedAt) / 1000 }
}

export const resetTimer = (timer: Timer): Timer => ({ ...timer, running: false, startedAt: undefined, accumulatedSec: 0 })

export function messageText(message: Message, timers: Timer[], now: number): string {
  const timer = timers.find((t) => t.id === message.timerId)
  return message.text.replace(/\{timer\}/gi, timer ? formatSeconds(timerSeconds(timer, now)) : '')
}

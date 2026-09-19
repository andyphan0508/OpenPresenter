import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { SlideTransition } from '../../types'

export const TRANSITION_MS = 500

interface Layer<T> {
  id: string
  value: T
  transition: SlideTransition
}

interface TransitionStackProps<T> {
  id: string // a new id animates in over the old one; same id = live edit, no transition
  value: T
  transition: SlideTransition
  hold?: boolean // outgoing layer stays opaque underneath (backgrounds) instead of fading out (text)
  render: (value: T, isTop: boolean) => ReactNode
}

const exitAnimation = (t: SlideTransition, hold: boolean) => (t === 'slide' ? 'op-slide-out' : hold ? 'none' : 'op-fade-out')

// Keeps the outgoing layer mounted while the incoming one animates. Layers are keyed by id, so an unchanged
// id (e.g. the same background video under a new slide) keeps its element and playback never restarts.
export function TransitionStack<T>({ id, value, transition, hold = false, render }: TransitionStackProps<T>) {
  const [layers, setLayers] = useState<Layer<T>[]>([{ id, value, transition: 'none' }])
  const shown = useRef(value)
  useEffect(() => {
    shown.current = value
  })

  const top = layers[layers.length - 1]
  if (top.id !== id) {
    const next = { id, value, transition }
    // ponytail: only the last outgoing layer is kept; rapid clicks during a transition drop older ones.
    setLayers(transition === 'none' ? [next] : [{ ...top, value: shown.current }, next])
  }

  useEffect(() => {
    if (layers.length < 2) return
    const t = setTimeout(() => setLayers((l) => l.slice(-1)), TRANSITION_MS)
    return () => clearTimeout(t)
  }, [layers])

  const last = layers.length - 1
  return (
    <>
      {layers.map((l, i) => {
        const name = i === last ? `op-${l.transition}-in` : exitAnimation(layers[last].transition, hold)
        return (
          <div key={l.id} className="absolute inset-0" style={last ? { animation: `${name} ${TRANSITION_MS}ms ease-in-out both` } : undefined}>
            {render(i === last ? value : l.value, i === last)}
          </div>
        )
      })}
    </>
  )
}

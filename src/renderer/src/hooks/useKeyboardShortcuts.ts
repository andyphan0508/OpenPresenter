import { useEffect } from 'react'
import { runShowCommand } from '../store/commands'
import type { ClearTarget } from '../types'

// ProPresenter clear keys. They work even while typing — the operator must always be able to blank the screen.
const CLEAR_KEYS: Record<string, ClearTarget> = { F1: 'all', F2: 'text', F3: 'media', F4: 'props', F5: 'messages' }

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const clear = CLEAR_KEYS[e.key]
      if (clear) {
        e.preventDefault()
        return runShowCommand({ type: 'clear', what: clear })
      }
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return

      if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key)) {
        e.preventDefault()
        runShowCommand({ type: 'next' })
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        runShowCommand({ type: 'prev' })
      } else if (e.key === 'Escape') {
        runShowCommand({ type: 'clear', what: 'all' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

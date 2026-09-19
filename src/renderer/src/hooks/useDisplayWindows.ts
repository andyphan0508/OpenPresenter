import { useCallback, useEffect, useState } from 'react'
import { isDisplayOpen, onDisplayChanged, toggleDisplay, type DisplayKind } from '../api/display'

// Open/closed state of the audience and stage windows.
export function useDisplayWindows() {
  const [open, setOpen] = useState<Record<DisplayKind, boolean>>({ output: false, stage: false })

  useEffect(() => {
    const set = (kind: DisplayKind, value: boolean) => setOpen((o) => ({ ...o, [kind]: value }))
    isDisplayOpen('output').then((v) => set('output', v))
    isDisplayOpen('stage').then((v) => set('stage', v))
    return onDisplayChanged(set)
  }, [])

  const toggle = useCallback(async (kind: DisplayKind) => {
    const value = await toggleDisplay(kind)
    setOpen((o) => ({ ...o, [kind]: value }))
  }, [])

  return { open, toggle }
}

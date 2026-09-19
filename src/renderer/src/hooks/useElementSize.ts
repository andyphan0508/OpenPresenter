import { useEffect, useRef, useState } from 'react'

// Size of the referenced element, tracked with ResizeObserver.
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, size] as const
}

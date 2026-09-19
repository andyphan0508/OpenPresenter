import { useCallback, useEffect, useRef, useState } from 'react'
import { getDecklinkInfo, startDecklink, stopDecklink, type DecklinkInfo, type DecklinkStatus } from '../api/decklink'
import { useStore } from '../store'

// Blackmagic UltraStudio / DeckLink output: device list, on/off, restart when its settings change on air.
export function useDecklink() {
  const deviceIndex = useStore((s) => s.settings.decklinkDevice)
  const format = useStore((s) => s.settings.decklinkFormat)
  const keyMode = useStore((s) => s.settings.decklinkKeyMode)
  const [info, setInfo] = useState<DecklinkInfo | null>(null)
  const [status, setStatus] = useState<DecklinkStatus>({ running: false })
  const running = useRef(false)
  running.current = status.running

  const refresh = useCallback(() => getDecklinkInfo().then(setInfo), [])
  useEffect(() => void refresh(), [refresh])

  const start = useCallback(async () => {
    const s = await startDecklink({ deviceIndex, format, keyMode })
    setStatus(s)
    return s
  }, [deviceIndex, format, keyMode])

  useEffect(() => {
    if (running.current) void start()
  }, [start])

  const stop = useCallback(async () => setStatus(await stopDecklink()), [])

  return { info, status, refresh, start, stop }
}

export type DecklinkControl = ReturnType<typeof useDecklink>

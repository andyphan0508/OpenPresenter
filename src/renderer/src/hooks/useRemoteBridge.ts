import { useEffect, useState } from 'react'
import { configureRemote, onRemoteAction, publishRemoteState, type RemoteStatus } from '../api/remote'
import { serviceItems } from '../helpers/serviceItems'
import { slideText } from '../helpers/slideFactory'
import { useStore } from '../store'
import { runShowCommand } from '../store/commands'
import { useCurrentPresentation, useLiveSlide } from './useSelectors'

// Runs the LAN remote server per settings, streams show state to phones, executes their commands.
export function useRemoteBridge(): RemoteStatus {
  const { remoteEnabled, remotePort, remotePin } = useStore((s) => s.settings)
  const [status, setStatus] = useState<RemoteStatus>({ running: false, urls: [] })
  const pres = useCurrentPresentation()
  const live = useLiveSlide()
  const layers = useStore((s) => s.layers)

  useEffect(() => {
    configureRemote(remoteEnabled, remotePort, remotePin).then(setStatus)
  }, [remoteEnabled, remotePort, remotePin])

  useEffect(() => onRemoteAction(runShowCommand), [])

  useEffect(() => {
    if (!status.running) return
    publishRemoteState({
      presentation: pres?.name ?? null,
      items: serviceItems(pres?.slides ?? []).map((item) => ({
        title: item.group?.title ?? slideText(item.slides[0]).split('\n')[0] ?? 'Slide',
        kind: item.group?.kind ?? 'custom',
        slides: item.slides.map((s) => ({ id: s.id, label: s.label, text: slideText(s) }))
      })),
      liveSlideId: live?.id ?? null,
      live: live && layers.text ? { label: live.label, text: slideText(live), translation: live.translation } : null,
      layers
    })
  }, [status.running, pres, live, layers])

  return status
}

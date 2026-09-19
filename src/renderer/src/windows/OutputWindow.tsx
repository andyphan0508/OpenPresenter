import { useEffect, useState } from 'react'
import { subscribeOutput } from '../api/display'
import { OutputScreen } from '../components/output/OutputScreen'
import { ALL_LAYERS_ON, DEFAULT_OUTPUT_SETTINGS } from '../constants/defaults'
import type { OutputPayload } from '../types'

const EMPTY: OutputPayload = {
  slide: null, media: null, props: [], message: null, timers: [],
  layers: ALL_LAYERS_ON, settings: DEFAULT_OUTPUT_SETTINGS, themes: []
}

export function OutputWindow() {
  const [payload, setPayload] = useState<OutputPayload>(EMPTY)
  useEffect(() => subscribeOutput(setPayload), [])
  return <OutputScreen payload={payload} />
}

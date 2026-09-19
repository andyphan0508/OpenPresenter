import { useEffect, useState } from 'react'
import { subscribeOutput } from '../api/display'
import { OutputScreen } from '../components/output/OutputScreen'
import { ALL_LAYERS_ON, DEFAULT_OUTPUT_SETTINGS } from '../constants/defaults'
import { keyBackground } from '../helpers/keyer'
import type { OutputPayload } from '../types'

const EMPTY: OutputPayload = {
  slide: null, media: null, props: [], message: null, timers: [],
  layers: ALL_LAYERS_ON, settings: DEFAULT_OUTPUT_SETTINGS, themes: []
}

// ?view=output (audience screen) or ?view=keyer&key=<mode> (hidden Blackmagic feed).
const params = new URLSearchParams(window.location.search)
const kind = params.get('view') === 'keyer' ? 'keyer' : 'output'
const background = kind === 'keyer' ? keyBackground(params.get('key')) : undefined

export function OutputWindow() {
  const [payload, setPayload] = useState<OutputPayload>(EMPTY)
  useEffect(() => subscribeOutput(setPayload, kind), [])
  return <OutputScreen payload={payload} keyBackground={background} />
}

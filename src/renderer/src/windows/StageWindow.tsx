import { useEffect, useState } from 'react'
import { subscribeStage } from '../api/display'
import { CloseDisplayButton } from '../components/output/CloseDisplayButton'
import { StageScreen } from '../components/stage/StageScreen'
import type { StagePayload } from '../types'

export function StageWindow() {
  const [data, setData] = useState<StagePayload>({ current: null, next: null, message: null, timers: [] })
  useEffect(() => subscribeStage(setData), [])
  return (
    <>
      <StageScreen data={data} />
      <CloseDisplayButton kind="stage" />
    </>
  )
}

import { useStore } from '../../store'
import type { OutputPayload, StagePayload } from '../../types'
import { Tabs } from '../ui/Tabs'
import { ClearBar } from './ClearBar'
import { MessagesTab } from './MessagesTab'
import { PreviewPanel } from './PreviewPanel'
import { PropsTab } from './PropsTab'
import { StageTab } from './StageTab'
import { TimersTab } from './TimersTab'

interface LivePanelProps {
  output: OutputPayload
  stage: StagePayload
  outputOpen: boolean
  stageOpen: boolean
}

// Right column (like ProPresenter): preview, clear row, show-control tabs.
export function LivePanel({ output, stage, outputOpen, stageOpen }: LivePanelProps) {
  const tab = useStore((s) => s.rightTab)
  const setTab = useStore((s) => s.setRightTab)
  return (
    <aside className="flex h-full flex-col bg-panel">
      <PreviewPanel payload={output} outputOpen={outputOpen} />
      <ClearBar />
      <Tabs
        value={tab}
        onChange={setTab}
        className="border-t border-line"
        tabs={[
          { id: 'stage', label: 'Sân khấu' },
          { id: 'messages', label: 'Tin nhắn' },
          { id: 'timers', label: 'Hẹn giờ' },
          { id: 'props', label: 'Props' }
        ]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'stage' && <StageTab stage={stage} stageOpen={stageOpen} />}
        {tab === 'messages' && <MessagesTab />}
        {tab === 'timers' && <TimersTab />}
        {tab === 'props' && <PropsTab />}
      </div>
    </aside>
  )
}

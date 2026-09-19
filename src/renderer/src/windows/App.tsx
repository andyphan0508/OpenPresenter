import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { BottomBin } from '../components/layout/BottomBin'
import { LeftSidebar } from '../components/layout/LeftSidebar'
import { ShortcutsDialog } from '../components/layout/ShortcutsDialog'
import { StatusBar } from '../components/layout/StatusBar'
import { Toolbar } from '../components/layout/Toolbar'
import { SongRepoDialog } from '../components/library/SongRepoDialog'
import { LivePanel } from '../components/live/LivePanel'
import { SettingsDialog } from '../components/settings/SettingsDialog'
import { CenterArea } from '../components/show/CenterArea'
import { useAutoAdvance } from '../hooks/useAutoAdvance'
import { useDisplayWindows } from '../hooks/useDisplayWindows'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useMidi } from '../hooks/useMidi'
import { useOutputSync } from '../hooks/useOutputSync'
import { useRemoteBridge } from '../hooks/useRemoteBridge'
import { useStageSync } from '../hooks/useStageSync'
import { useStore } from '../store'

const Handle = ({ vertical }: { vertical?: boolean }) => (
  <PanelResizeHandle className={`${vertical ? 'h-1' : 'w-1'} bg-line transition-colors hover:bg-select data-[resize-handle-state=drag]:bg-select`} />
)

// Operator console. Side effects (output/stage/remote/MIDI/keys) live in hooks; layout mirrors ProPresenter.
export function App() {
  const output = useOutputSync()
  const stage = useStageSync()
  const remoteStatus = useRemoteBridge()
  const displays = useDisplayWindows()
  useKeyboardShortcuts()
  useAutoAdvance()
  useMidi()

  const colorScheme = useStore((s) => s.colorScheme)
  const bottomBin = useStore((s) => s.bottomBin)
  const dialog = useStore((s) => s.dialog)
  const openDialog = useStore((s) => s.openDialog)
  const close = () => openDialog(null)

  return (
    <div className={`${colorScheme} flex h-screen flex-col overflow-hidden bg-app text-fg`}>
      <Toolbar displays={displays.open} remoteRunning={remoteStatus.running} onToggleDisplay={displays.toggle} />

      <PanelGroup direction="horizontal" autoSaveId="op-main" className="min-h-0 flex-1">
        <Panel id="left" order={1} defaultSize={19} minSize={14} maxSize={32}>
          <LeftSidebar />
        </Panel>
        <Handle />
        <Panel id="center" order={2} minSize={35}>
          <PanelGroup direction="vertical" autoSaveId="op-center">
            <Panel id="stage-area" order={1} minSize={30}>
              <CenterArea />
            </Panel>
            {bottomBin && (
              <>
                <Handle vertical />
                <Panel id="bin" order={2} defaultSize={38} minSize={20}>
                  <BottomBin />
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>
        <Handle />
        <Panel id="right" order={3} defaultSize={23} minSize={18} maxSize={36}>
          <LivePanel output={output} stage={stage} outputOpen={displays.open.output} stageOpen={displays.open.stage} />
        </Panel>
      </PanelGroup>

      <StatusBar />

      {(dialog === 'settings' || dialog === 'remote') && (
        <SettingsDialog initialTab={dialog === 'remote' ? 'remote' : 'display'} remoteStatus={remoteStatus} onClose={close} />
      )}
      {dialog === 'songRepo' && <SongRepoDialog onClose={close} />}
      {dialog === 'shortcuts' && <ShortcutsDialog onClose={close} />}
    </div>
  )
}

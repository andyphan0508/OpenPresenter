import { useState } from 'react'
import type { RemoteStatus } from '../../api/remote'
import type { DecklinkControl } from '../../hooks/useDecklink'
import { Modal } from '../ui/Modal'
import { Tabs } from '../ui/Tabs'
import { BlackmagicSettings } from './BlackmagicSettings'
import { DisplaySettings } from './DisplaySettings'
import { MidiSettings } from './MidiSettings'
import { RemoteSettings } from './RemoteSettings'

type Tab = 'display' | 'blackmagic' | 'remote' | 'midi'

export function SettingsDialog({
  initialTab = 'display',
  remoteStatus,
  decklink,
  onClose
}: {
  initialTab?: Tab
  remoteStatus: RemoteStatus
  decklink: DecklinkControl
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  return (
    <Modal title="Cài đặt" onClose={onClose} width="w-[680px]">
      <Tabs
        value={tab}
        onChange={setTab}
        className="-mx-5 -mt-5 mb-5 px-3"
        tabs={[
          { id: 'display', label: 'Màn hình & Theme' },
          { id: 'blackmagic', label: 'Blackmagic / Livestream' },
          { id: 'remote', label: 'Điều khiển từ xa' },
          { id: 'midi', label: 'MIDI' }
        ]}
      />
      {tab === 'display' && <DisplaySettings />}
      {tab === 'blackmagic' && <BlackmagicSettings control={decklink} />}
      {tab === 'remote' && <RemoteSettings status={remoteStatus} />}
      {tab === 'midi' && <MidiSettings />}
    </Modal>
  )
}

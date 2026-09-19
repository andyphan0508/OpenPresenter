import { ListBullets, MusicNotes } from '@phosphor-icons/react'
import { useStore } from '../../store'
import { LibrarySidebar } from '../library/LibrarySidebar'
import { ServiceSidebar } from '../service/ServiceSidebar'
import { Tabs } from '../ui/Tabs'

// Left column: service order (playlists) or song library — like ProPresenter's Library/Playlist pane.
export function LeftSidebar() {
  const leftTab = useStore((s) => s.leftTab)
  const setLeftTab = useStore((s) => s.setLeftTab)
  return (
    <aside className="flex h-full flex-col bg-panel">
      <Tabs
        value={leftTab}
        onChange={setLeftTab}
        tabs={[
          { id: 'service', label: 'Chương trình', icon: <ListBullets size={14} /> },
          { id: 'library', label: 'Thư viện', icon: <MusicNotes size={14} /> }
        ]}
      />
      <div className="min-h-0 flex-1">{leftTab === 'service' ? <ServiceSidebar /> : <LibrarySidebar />}</div>
    </aside>
  )
}

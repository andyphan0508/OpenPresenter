import { useStore } from '../../store'
import { SlideEditor } from '../editor/SlideEditor'
import { SongEditor } from '../library/SongEditor'
import { SongView } from '../library/SongView'
import { SlideGrid } from './SlideGrid'

// Center pane: what it shows depends on the mode (Show/Edit) and whether the library tab is open.
export function CenterArea() {
  const mode = useStore((s) => s.mode)
  const library = useStore((s) => s.leftTab === 'library')
  if (library) return mode === 'edit' ? <SongEditor /> : <SongView />
  return mode === 'edit' ? <SlideEditor /> : <SlideGrid />
}

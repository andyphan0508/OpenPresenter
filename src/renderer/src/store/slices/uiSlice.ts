import type { SliceCreator } from '../types'

export type Mode = 'show' | 'edit'
export type LeftTab = 'service' | 'library'
export type BottomBin = 'bible' | 'media' | 'themes'
export type RightTab = 'stage' | 'messages' | 'timers' | 'props'
export type Dialog = 'settings' | 'remote' | 'blackmagic' | 'songRepo' | 'shortcuts' | null

// Layout/navigation state of the operator console (not persisted except color scheme).
export interface UiSlice {
  mode: Mode
  leftTab: LeftTab
  selectedSongId: string | null
  bottomBin: BottomBin | null
  rightTab: RightTab
  dialog: Dialog
  colorScheme: 'dark' | 'light'

  setMode: (mode: Mode) => void
  setLeftTab: (tab: LeftTab) => void
  selectSong: (id: string | null) => void
  toggleBottomBin: (bin: BottomBin) => void
  setRightTab: (tab: RightTab) => void
  openDialog: (dialog: Dialog) => void
  toggleColorScheme: () => void
}

export const createUiSlice: SliceCreator<UiSlice> = (set) => ({
  mode: 'show',
  leftTab: 'service',
  selectedSongId: null,
  bottomBin: null,
  rightTab: 'stage',
  dialog: null,
  colorScheme: 'dark',

  setMode: (mode) => set({ mode }),
  setLeftTab: (leftTab) => set({ leftTab }),
  selectSong: (selectedSongId) => set({ selectedSongId }),
  toggleBottomBin: (bin) => set((s) => ({ bottomBin: s.bottomBin === bin ? null : bin })),
  setRightTab: (rightTab) => set({ rightTab }),
  openDialog: (dialog) => set({ dialog }),
  toggleColorScheme: () => set((s) => ({ colorScheme: s.colorScheme === 'dark' ? 'light' : 'dark' }))
})

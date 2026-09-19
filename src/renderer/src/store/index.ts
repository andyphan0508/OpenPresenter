import { create } from 'zustand'
import { createAssetsSlice } from './slices/assetsSlice'
import { createControlsSlice } from './slices/controlsSlice'
import { createLiveSlice } from './slices/liveSlice'
import { createPresentationSlice } from './slices/presentationSlice'
import { createSettingsSlice } from './slices/settingsSlice'
import { createSongSlice } from './slices/songSlice'
import { createUiSlice } from './slices/uiSlice'
import type { AppState } from './types'

export type { AppState }

export const useStore = create<AppState>()((...a) => ({
  ...createPresentationSlice(...a),
  ...createSongSlice(...a),
  ...createLiveSlice(...a),
  ...createAssetsSlice(...a),
  ...createControlsSlice(...a),
  ...createSettingsSlice(...a),
  ...createUiSlice(...a)
}))

import type { StateCreator } from 'zustand'
import type { AssetsSlice } from './slices/assetsSlice'
import type { ControlsSlice } from './slices/controlsSlice'
import type { LiveSlice } from './slices/liveSlice'
import type { PresentationSlice } from './slices/presentationSlice'
import type { SettingsSlice } from './slices/settingsSlice'
import type { SongSlice } from './slices/songSlice'
import type { UiSlice } from './slices/uiSlice'

export type AppState = PresentationSlice & SongSlice & LiveSlice & AssetsSlice & ControlsSlice & SettingsSlice & UiSlice

export type SliceCreator<T> = StateCreator<AppState, [], [], T>

import { DEFAULT_APP_SETTINGS, DEFAULT_OUTPUT_SETTINGS } from '../../constants/defaults'
import type { AppSettings, OutputSettings } from '../../types'
import type { SliceCreator } from '../types'

export interface SettingsSlice {
  outputSettings: OutputSettings
  settings: AppSettings
  updateOutputSettings: (updates: Partial<OutputSettings>) => void
  updateSettings: (updates: Partial<AppSettings>) => void
}

export const createSettingsSlice: SliceCreator<SettingsSlice> = (set) => ({
  outputSettings: DEFAULT_OUTPUT_SETTINGS,
  settings: DEFAULT_APP_SETTINGS,
  updateOutputSettings: (updates) => set((s) => ({ outputSettings: { ...s.outputSettings, ...updates } })),
  updateSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } }))
})

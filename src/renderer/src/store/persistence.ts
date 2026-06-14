import { useStore } from './useStore'

const STORAGE_KEY = 'openpresenter-state'

export function saveState() {
  try {
    const state = useStore.getState()
    const toSave = {
      presentations: state.presentations,
      songs: state.songs,
      media: state.media,
      outputSettings: state.outputSettings,
      theme: state.theme
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('Failed to save state:', e)
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)

    useStore.setState((state) => ({
      presentations: saved.presentations ?? state.presentations,
      songs: saved.songs?.length ? saved.songs : state.songs,
      media: saved.media ?? state.media,
      outputSettings: saved.outputSettings ?? state.outputSettings,
      theme: saved.theme ?? state.theme
    }))
  } catch (e) {
    console.error('Failed to load state:', e)
  }
}

// Auto-save on store changes (debounced)
let saveTimer: ReturnType<typeof setTimeout> | null = null

export function setupAutosave() {
  loadState()

  useStore.subscribe((state, prev) => {
    // Mark the project dirty whenever persisted data (not transient UI) changes.
    const dataChanged =
      state.presentations !== prev.presentations ||
      state.songs !== prev.songs ||
      state.media !== prev.media ||
      state.outputSettings !== prev.outputSettings
    if (dataChanged && !state.dirty) {
      useStore.setState({ dirty: true })
    }

    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveState, 500)
  })
}

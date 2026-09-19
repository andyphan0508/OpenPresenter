import { loadAppData, saveAppData } from '../api/storage'
import { DEFAULT_APP_SETTINGS, DEFAULT_THEMES } from '../constants/defaults'
import { migrateSong } from '../helpers/songFactory'
import { useStore, type AppState } from './index'

// Only documents and preferences are saved; live/UI state starts fresh each launch.
const PERSISTED = [
  'presentations', 'songs', 'themes', 'media', 'props', 'messages', 'timers', 'outputSettings', 'settings', 'colorScheme'
] as const satisfies readonly (keyof AppState)[]

type Saved = Partial<Pick<AppState, (typeof PERSISTED)[number]>>

const snapshot = (s: AppState): Saved => Object.fromEntries(PERSISTED.map((k) => [k, s[k]]))

// Data saved before themes existed: song/Bible slides get the default theme for their kind.
function linkLegacySlides(presentations: AppState['presentations'], settings: AppState['settings']) {
  return presentations.map((p) => ({
    ...p,
    slides: p.slides.map((s) =>
      s.group && !s.themeId
        ? { ...s, themeId: s.group.kind === 'bible' ? settings.bibleThemeId : settings.songThemeId }
        : s
    )
  }))
}

function migrate(saved: Saved, current: AppState): Saved {
  const themes = saved.themes ?? current.themes
  const settings = { ...DEFAULT_APP_SETTINGS, ...saved.settings }
  return {
    ...saved,
    presentations: saved.themes ? saved.presentations : linkLegacySlides(saved.presentations ?? [], settings),
    songs: saved.songs?.length ? saved.songs.map(migrateSong) : current.songs,
    // Built-in themes must exist: settings and slides reference them by id.
    themes: [...DEFAULT_THEMES.filter((d) => !themes.some((t) => t.id === d.id)), ...themes],
    settings
  }
}

export async function loadState(): Promise<void> {
  try {
    const raw = await loadAppData()
    if (!raw) return
    useStore.setState((s) => migrate(JSON.parse(raw), s))
  } catch (e) {
    console.error('Failed to load state:', e)
  }
}

let timer: ReturnType<typeof setTimeout> | null = null

function save(): void {
  timer = null
  if (!saveAppData(JSON.stringify(snapshot(useStore.getState())))) console.error('Failed to save state')
}

// Debounced autosave on document changes, plus a final flush when the window closes.
export async function setupAutosave(): Promise<void> {
  await loadState()
  useStore.subscribe((state, prev) => {
    if (PERSISTED.every((k) => state[k] === prev[k])) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(save, 500)
  })
  window.addEventListener('beforeunload', () => {
    if (timer) save()
  })
}

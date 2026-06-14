import { ProjectData } from '../types'
import { useStore } from './useStore'

// ─── Custom project file format (.opres) ──────────────────────────────────────
// A project is a single self-contained JSON file. We tag it with a magic
// `format` marker + version so the app can recognise — and refuse — anything
// that is not a genuine OpenPresenter project.

export const PROJECT_EXT = 'opres'
export const PROJECT_FORMAT = 'openpresenter-project'
export const PROJECT_VERSION = 1

/** Dialog filter that restricts pickers to OpenPresenter project files only. */
export const PROJECT_FILTERS = [{ name: 'OpenPresenter Project', extensions: [PROJECT_EXT] }]

interface ProjectFile {
  format: string
  version: number
  app: string
  savedAt: string
  data: ProjectData
}

export interface IOResult {
  ok: boolean
  /** Absolute path that was written/read, when successful. */
  path?: string
  /** 'canceled' when the user dismissed the dialog, otherwise an error message. */
  error?: string
  canceled?: boolean
}

function serialize(): string {
  const file: ProjectFile = {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    app: 'OpenPresenter',
    savedAt: new Date().toISOString(),
    data: useStore.getState().exportProjectData()
  }
  return JSON.stringify(file, null, 2)
}

/**
 * Parse + validate a file's text. Returns the embedded ProjectData, or throws a
 * human-readable error if the file is not a valid OpenPresenter project.
 */
function parseProjectFile(text: string): ProjectData {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Tệp không hợp lệ — không đọc được nội dung.')
  }
  const file = parsed as Partial<ProjectFile>
  if (!file || file.format !== PROJECT_FORMAT) {
    throw new Error('Đây không phải tệp dự án OpenPresenter (.opres).')
  }
  if (typeof file.version !== 'number' || file.version > PROJECT_VERSION) {
    throw new Error('Tệp được tạo bởi phiên bản mới hơn — không thể mở.')
  }
  const data = file.data as Partial<ProjectData> | undefined
  if (!data || !Array.isArray(data.presentations) || !Array.isArray(data.songs)) {
    throw new Error('Tệp dự án bị hỏng hoặc thiếu dữ liệu.')
  }
  return {
    presentations: data.presentations,
    songs: data.songs,
    media: Array.isArray(data.media) ? data.media : [],
    outputSettings: (data.outputSettings ?? {}) as ProjectData['outputSettings'],
    theme: data.theme === 'light' ? 'light' : 'dark'
  }
}

/** Decode the base64 payload returned by `readFile` as UTF-8 (keeps Vietnamese intact). */
function decodeUtf8Base64(base64: string): string {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

/** Suggest a file name from the current presentation / project. */
function suggestedName(): string {
  const state = useStore.getState()
  const pres = state.presentations.find((p) => p.id === state.currentPresentationId)
  const base = pres?.name || state.presentations[0]?.name || 'Untitled'
  return `${base}.${PROJECT_EXT}`
}

async function writeTo(path: string): Promise<IOResult> {
  const res = await window.api.writeFile(path, serialize())
  if (!res.success) return { ok: false, error: res.error || 'Không ghi được tệp.' }
  useStore.getState().setProjectFile(path)
  return { ok: true, path }
}

/**
 * Save the project. Writes to the current file when one is open (unless
 * `saveAs`), otherwise prompts for a location.
 */
export async function saveProject(saveAs = false): Promise<IOResult> {
  const current = useStore.getState().currentFilePath
  if (current && !saveAs) {
    return writeTo(current)
  }
  const result = await window.api.saveFileDialog({
    title: saveAs ? 'Save Project As' : 'Save Project',
    defaultPath: suggestedName(),
    filters: PROJECT_FILTERS
  })
  if (result.canceled || !result.filePath) return { ok: false, canceled: true }
  // Guarantee the extension even if the OS dialog dropped it.
  const path = result.filePath.endsWith(`.${PROJECT_EXT}`)
    ? result.filePath
    : `${result.filePath}.${PROJECT_EXT}`
  return writeTo(path)
}

/** Read + load a project from an explicit path (used by file-association open). */
export async function openProjectPath(path: string): Promise<IOResult> {
  const res = await window.api.readFile(path)
  if (!res.success || !res.data) {
    return { ok: false, error: res.error || 'Không đọc được tệp.' }
  }
  try {
    const data = parseProjectFile(decodeUtf8Base64(res.data))
    useStore.getState().loadProjectData(data)
    useStore.getState().setProjectFile(path)
    return { ok: true, path }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** Prompt for a `.opres` file (filtered) and load it. */
export async function openProjectDialog(): Promise<IOResult> {
  const result = await window.api.openFileDialog({
    title: 'Open Project',
    filters: PROJECT_FILTERS
  })
  if (result.canceled || !result.filePaths?.length) return { ok: false, canceled: true }
  return openProjectPath(result.filePaths[0])
}

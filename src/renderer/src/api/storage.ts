const LEGACY_STORAGE_KEY = 'openpresenter-state'

// App data file in userData; very old versions kept it in localStorage.
export async function loadAppData(): Promise<string | null> {
  return (await window.api.storage.load()) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
}

export const saveAppData = (json: string): boolean => window.api.storage.save(json)

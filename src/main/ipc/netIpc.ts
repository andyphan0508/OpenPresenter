import { ipcMain, net } from 'electron'

const MAX_BYTES = 20 * 1024 * 1024

// Fetch from the main process: no CORS limits for song repositories hosted anywhere.
export function registerNetIpc(): void {
  ipcMain.handle('net:fetch-text', async (_e, url: string) => {
    try {
      if (!/^https?:\/\//i.test(url)) throw new Error('Chỉ hỗ trợ địa chỉ http(s)')
      const res = await net.fetch(url, { signal: AbortSignal.timeout(15_000) })
      if (!res.ok) {
        // JSON APIs (e.g. the program API) explain the error in { error }.
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error || `Máy chủ trả về lỗi ${res.status}`)
      }
      const text = await res.text()
      if (text.length > MAX_BYTES) throw new Error('File quá lớn')
      return { ok: true, text }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  })
}

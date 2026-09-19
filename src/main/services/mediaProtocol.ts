import { protocol } from 'electron'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

// media://local/<encodeURIComponent(absolute path)> — lets every window (dev server or file://) show local images/videos.
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm'
}
export const MEDIA_EXTENSIONS = Object.keys(MIME).map((e) => e.slice(1))

export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'media', privileges: { secure: true, standard: true, supportFetchAPI: true, stream: true, bypassCSP: true } }
  ])
}

const body = (file: string, opts?: { start: number; end: number }) =>
  Readable.toWeb(fs.createReadStream(file, opts)) as unknown as ReadableStream

export function handleMediaProtocol(): void {
  protocol.handle('media', async (req) => {
    const file = decodeURIComponent(new URL(req.url).pathname).slice(1)
    const type = MIME[path.extname(file).toLowerCase()]
    if (!type) return new Response('Unsupported media type', { status: 415 })
    const stat = await fs.promises.stat(file).catch(() => null)
    if (!stat?.isFile()) return new Response('Not found', { status: 404 })

    // Range support so videos can loop and seek.
    const range = req.headers.get('range')?.match(/bytes=(\d*)-(\d*)/)
    if (range) {
      const start = range[1] ? +range[1] : 0
      const end = range[2] ? Math.min(+range[2], stat.size - 1) : stat.size - 1
      return new Response(body(file, { start, end }), {
        status: 206,
        headers: {
          'Content-Type': type,
          'Content-Length': String(end - start + 1),
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes'
        }
      })
    }
    return new Response(body(file), {
      headers: { 'Content-Type': type, 'Content-Length': String(stat.size), 'Accept-Ranges': 'bytes' }
    })
  })
}

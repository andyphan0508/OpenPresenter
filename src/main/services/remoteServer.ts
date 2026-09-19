import { app } from 'electron'
import crypto from 'crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

/**
 * LAN remote for phones/tablets + read-only lower-third page for OBS (Browser Source).
 *   GET  /               remote control page (asks for PIN)
 *   GET  /lower-third    transparent lyrics overlay for livestream
 *   GET  /events?pin=    SSE: full show state (PIN required)
 *   GET  /events/public  SSE: current slide text only (no PIN — it is what the audience already sees)
 *   POST /action?pin=    { type: 'next' | 'prev' | 'goto' | 'clear', ... }
 */

type RemoteState = { live?: unknown } & Record<string, unknown>
type Client = { res: http.ServerResponse; full: boolean }

const ALLOWED_ACTIONS = new Set(['next', 'prev', 'goto', 'clear'])
const MAX_BODY = 10_000
// A 4-digit PIN is guessable on a shared network: lock an address out after repeated misses.
const MAX_FAILS = 10
const LOCKOUT_MS = 60_000

let server: http.Server | null = null
let pin = ''
let state: RemoteState = {}
let status: { running: boolean; urls: string[]; error?: string } = { running: false, urls: [] }
const clients = new Set<Client>()
const failures = new Map<string, { count: number; until: number }>()

const page = (name: string) => fs.readFileSync(path.join(app.getAppPath(), 'resources/remote', name), 'utf-8')

function pinOk(req: http.IncomingMessage, given: string | null): boolean {
  const ip = req.socket.remoteAddress ?? '?'
  const entry = failures.get(ip)
  if (entry && entry.until > Date.now()) return false
  const a = Buffer.from(given ?? '')
  const b = Buffer.from(pin)
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b)
  if (ok) failures.delete(ip)
  else {
    const count = (entry?.count ?? 0) + 1
    failures.set(ip, { count: count >= MAX_FAILS ? 0 : count, until: count >= MAX_FAILS ? Date.now() + LOCKOUT_MS : 0 })
  }
  return ok
}

const payloadFor = (client: Client) => JSON.stringify(client.full ? state : { live: state.live ?? null })

function send(client: Client): void {
  client.res.write(`data: ${payloadFor(client)}\n\n`)
}

function lanUrls(port: number): string[] {
  const ips = Object.values(os.networkInterfaces())
    .flat()
    .filter((n) => n && n.family === 'IPv4' && !n.internal)
    .map((n) => n!.address)
  return [...ips, 'localhost'].map((ip) => `http://${ip}:${port}`)
}

function handle(req: http.IncomingMessage, res: http.ServerResponse, onAction: (a: unknown) => void): void {
  const url = new URL(req.url ?? '/', 'http://x')

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/lower-third')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(page(url.pathname === '/' ? 'remote.html' : 'lower-third.html'))
    return
  }

  if (req.method === 'GET' && (url.pathname === '/events' || url.pathname === '/events/public')) {
    const full = url.pathname === '/events'
    if (full && !pinOk(req, url.searchParams.get('pin'))) {
      res.writeHead(401).end('PIN sai')
      return
    }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
    const client = { res, full }
    clients.add(client)
    send(client)
    req.on('close', () => clients.delete(client))
    return
  }

  if (req.method === 'POST' && url.pathname === '/action') {
    if (!pinOk(req, url.searchParams.get('pin'))) {
      res.writeHead(401).end('PIN sai')
      return
    }
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > MAX_BODY) req.destroy()
    })
    req.on('end', () => {
      try {
        const action = JSON.parse(body)
        if (!ALLOWED_ACTIONS.has(action?.type)) throw new Error('bad action')
        onAction(action)
        res.writeHead(204).end()
      } catch {
        res.writeHead(400).end('Lệnh không hợp lệ')
      }
    })
    return
  }

  res.writeHead(404).end()
}

export function stopRemote(): void {
  for (const c of clients) c.res.end()
  clients.clear()
  server?.close()
  server = null
  status = { running: false, urls: [] }
}

export function startRemote(port: number, newPin: string, onAction: (a: unknown) => void): Promise<typeof status> {
  stopRemote()
  pin = newPin
  failures.clear()
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => handle(req, res, onAction))
    srv.once('error', (e: NodeJS.ErrnoException) => {
      status = { running: false, urls: [], error: e.code === 'EADDRINUSE' ? `Cổng ${port} đang được dùng` : e.message }
      resolve(status)
    })
    srv.listen(port, '0.0.0.0', () => {
      server = srv
      status = { running: true, urls: lanUrls(port) }
      resolve(status)
    })
  })
}

export function publishRemoteState(next: RemoteState): void {
  state = next
  for (const c of clients) send(c)
}

export const remoteStatus = () => status

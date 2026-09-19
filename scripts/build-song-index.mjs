#!/usr/bin/env node
// Build a song repository index from a folder of song markdown files.
//   node scripts/build-song-index.mjs <songs-folder> [out.json] [name]
// Each file (e.g. songs/thanh-ca/001.md) becomes { id: "thanh-ca/001", markdown, updatedAt }.
// Host the JSON anywhere (GitHub raw URL works) and paste the URL into Thư viện → Nhập → Kho bài hát.
import fs from 'node:fs'
import path from 'node:path'

const [dir, out = 'index.json', name = path.basename(path.resolve(dir ?? '.'))] = process.argv.slice(2)
if (!dir) {
  console.error('Usage: node scripts/build-song-index.mjs <songs-folder> [out.json] [name]')
  process.exit(1)
}

const songs = fs
  .readdirSync(dir, { recursive: true })
  .filter((f) => f.endsWith('.md') && path.basename(f).toLowerCase() !== 'readme.md')
  .sort()
  .map((f) => {
    const file = path.join(dir, f)
    const markdown = fs.readFileSync(file, 'utf-8')
    if (!/^# .+/m.test(markdown)) throw new Error(`${f}: missing "# Title" line`)
    return { id: f.replace(/\\/g, '/').replace(/\.md$/, ''), markdown, updatedAt: fs.statSync(file).mtime.toISOString() }
  })

fs.writeFileSync(out, JSON.stringify({ name, songs }, null, 2))
console.log(`Wrote ${songs.length} songs to ${out}`)

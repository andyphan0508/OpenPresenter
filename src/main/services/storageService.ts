import { app } from 'electron'
import fs from 'fs'
import path from 'path'

const dataFile = () => path.join(app.getPath('userData'), 'openpresenter-data.json')

export function loadData(): string | null {
  try {
    return fs.readFileSync(dataFile(), 'utf-8')
  } catch {
    return null
  }
}

// Write-then-rename so a crash never leaves half a file.
export function saveData(json: string): boolean {
  try {
    const tmp = dataFile() + '.tmp'
    fs.writeFileSync(tmp, json, 'utf-8')
    fs.renameSync(tmp, dataFile())
    return true
  } catch (e) {
    console.error('saveData failed:', e)
    return false
  }
}

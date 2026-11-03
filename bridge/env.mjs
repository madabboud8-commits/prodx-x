/**
 * X: load the project's .env file before anything else reads process.env.
 *
 * Upstream Jarvis expected you to export variables in the shell, which is
 * awkward on Windows. Here one `.env` file at the project root holds
 * everything: the bridge reads it through this loader, and Vite reads the
 * VITE_* lines from the same file for the browser. Variables already set in
 * the shell win over the file.
 *
 * X_* names are the ones to use. They are mapped onto the JARVIS_* names the
 * rest of the upstream code still reads, so the internals stay untouched.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function load(file) {
  if (!existsSync(file)) return
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1)
    if (value === '') continue
    if (process.env[key] === undefined) process.env[key] = value
  }
}

load(join(ROOT, '.env'))
load(join(ROOT, '.env.local'))

const ALIASES = {
  X_BRIDGE_PORT: 'JARVIS_BRIDGE_PORT',
  X_MODEL: 'JARVIS_MODEL',
  X_EFFORT: 'JARVIS_EFFORT',
  X_ALLOW_WRITES: 'JARVIS_ALLOW_WRITES',
  X_ALLOWED_ORIGINS: 'JARVIS_ALLOWED_ORIGINS',
  X_FILE_ROOTS: 'JARVIS_FILE_ROOTS',
  X_VOICE_ID: 'JARVIS_VOICE_ID',
  X_DEBUG: 'JARVIS_DEBUG',
}
for (const [x, j] of Object.entries(ALIASES)) {
  if (process.env[x] !== undefined && process.env[j] === undefined) {
    process.env[j] = process.env[x]
  }
}

// `node bridge/server.mjs --writes` works on Windows too, unlike VAR=1 syntax.
if (process.argv.includes('--writes')) process.env.JARVIS_ALLOW_WRITES = '1'

/** Where X keeps test files, results and the photo inbox. */
export const LAB_DIR = process.env.X_LAB_DIR ?? join(ROOT, 'lab')

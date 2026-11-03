import { useEffect, useRef } from 'react'
import { useStore, type Phase } from '../store'

/**
 * X's face: a glowing neural burst, after Imad's reference image
 * (lab/../x-assistant/reference/x-look-reference.png in the project files).
 *
 * A bright core with orange and gold filaments branching out of it, nodes
 * strung along them, a plexus of links in the inner ring, and small data tags
 * pinned around the core. It breathes when idle, pulses signals outward while
 * X thinks or researches, and the filaments flare with the voice level.
 *
 * Drawn on a 2D canvas with additive blending: each filament is stroked twice
 * (a wide faint pass and a thin bright pass) to fake the glow without the cost
 * of shadowBlur on every line.
 */

type Fil = {
  pts: { x: number; y: number }[] // unit space, core at 0,0, radius ~1
  hue: number // 0 = deep orange, 1 = gold
  width: number
  phase: number
  nodes: number[] // indices into pts that carry a node
}

const TAGS: { x: number; y: number; text: string }[] = [
  { x: -0.18, y: -0.46, text: 'DATASHEET · CLAIMS' },
  { x: 0.22, y: -0.3, text: 'SPEC CHECK  kW / W' },
  { x: -0.42, y: -0.06, text: 'SOURCE: BRAND > ALIBABA' },
  { x: 0.3, y: 0.08, text: 'NOISE  dB(A)' },
  { x: -0.2, y: 0.3, text: 'HEAT-UP  t(min)' },
  { x: 0.12, y: 0.52, text: 'RESULT ARCHIVE' },
]

function rand(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function build(): Fil[] {
  const r = rand(7)
  const fils: Fil[] = []
  const N = 150
  for (let i = 0; i < N; i++) {
    // Denser bursts up and down, like the reference.
    const base = r() * Math.PI * 2
    const bias = Math.sin(base * 2) * 0.35
    let a = base + bias
    const len = 0.55 + Math.pow(r(), 1.6) * 1.35
    const steps = 14
    const pts = []
    let x = Math.cos(a) * (0.16 + r() * 0.08)
    let y = Math.sin(a) * (0.16 + r() * 0.08)
    const curl = (r() - 0.5) * 0.08
    for (let k = 0; k < steps; k++) {
      pts.push({ x, y })
      a += curl + (r() - 0.5) * 0.25
      const st = len / steps
      x += Math.cos(a) * st
      y += Math.sin(a) * st * 1.05
    }
    const nodes: number[] = []
    for (let k = 2; k < steps; k++) if (r() < 0.22) nodes.push(k)
    fils.push({ pts, hue: r(), width: 0.6 + r() * 1.4, phase: r() * Math.PI * 2, nodes })
  }
  return fils
}

const FILS = build()

/** Plexus links between nearby nodes in the inner ring. */
const LINKS: [number, number, number, number][] = (() => {
  const nodes: { x: number; y: number }[] = []
  for (const f of FILS) for (const n of f.nodes) if (n < 7) nodes.push(f.pts[n])
  const out: [number, number, number, number][] = []
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x
      const dy = nodes[i].y - nodes[j].y
      if (dx * dx + dy * dy < 0.012) out.push([nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y])
    }
  return out.slice(0, 260)
})()

const ACTIVITY: Record<Phase, number> = {
  offline: 0.15, boot: 0.5, dormant: 0.45, waking: 0.8, listening: 0.8,
  thinking: 1, tooling: 1, speaking: 0.9,
}

function colour(h: number, a: number) {
  // deep orange (255,74,0) -> gold (255,210,122)
  const g = Math.round(74 + (210 - 74) * h)
  const b = Math.round(0 + 122 * h * h)
  return `rgba(255,${g},${b},${a})`
}

export function Neural() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const style = useStore((s) => s.ui.reactor.style)
  const visible = useStore((s) => s.ui.reactor.visible)
  const phase = useStore((s) => s.phase)
  const on = visible && style === 'neural' && phase !== 'offline' && phase !== 'boot'

  useEffect(() => {
    if (!on) return
    const cv = canvas.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let lvl = 0
    let act = 0.5
    const t0 = performance.now()

    const frame = () => {
      const s = useStore.getState()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const W = cv.clientWidth
      const H = cv.clientHeight
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr)
        cv.height = Math.round(H * dpr)
      }
      const t = reduced ? 0 : (performance.now() - t0) / 1000
      const live = s.phase === 'listening' || s.phase === 'speaking'
      lvl += ((live ? s.level : 0) - lvl) * 0.2
      act += (ACTIVITY[s.phase] - act) * 0.05
      const busy = s.phase === 'thinking' || s.phase === 'tooling'
      const R = Math.min(W, H) * 0.3 * s.ui.reactor.scale
      const I = s.ui.reactor.intensity * act
      const cx = W / 2
      const cy = H / 2

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'

      const breathe = 1 + Math.sin(t * 0.8) * 0.02 + lvl * 0.12
      const P = (p: { x: number; y: number }, f: Fil, k: number) => {
        const wob = Math.sin(t * 0.9 + f.phase + k * 0.4) * 0.012 * k
        return [cx + (p.x * breathe + wob) * R, cy + (p.y * breathe - wob) * R] as const
      }

      // Plexus links.
      ctx.lineWidth = 0.6
      ctx.strokeStyle = colour(0.4, 0.18 * I)
      ctx.beginPath()
      for (const [x1, y1, x2, y2] of LINKS) {
        ctx.moveTo(cx + x1 * breathe * R, cy + y1 * breathe * R)
        ctx.lineTo(cx + x2 * breathe * R, cy + y2 * breathe * R)
      }
      ctx.stroke()

      // Filaments: glow pass then core pass.
      for (const pass of [0, 1]) {
        for (const f of FILS) {
          const flick = 0.75 + 0.25 * Math.sin(t * 1.7 + f.phase * 3)
          const a = (pass ? 0.55 : 0.09) * I * flick * (1 + lvl * 1.5)
          ctx.strokeStyle = colour(f.hue, Math.min(1, a))
          ctx.lineWidth = pass ? f.width * 0.7 : f.width * 4
          ctx.beginPath()
          f.pts.forEach((p, k) => {
            const [x, y] = P(p, f, k)
            if (k === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
          ctx.stroke()
        }
      }

      // Nodes, and signals travelling outward while busy.
      for (const f of FILS) {
        for (const n of f.nodes) {
          const [x, y] = P(f.pts[n], f, n)
          ctx.fillStyle = colour(Math.min(1, f.hue + 0.3), 0.85 * I)
          ctx.beginPath()
          ctx.arc(x, y, 1.6, 0, Math.PI * 2)
          ctx.fill()
        }
        if (busy || lvl > 0.05) {
          const speed = busy ? 0.6 : 0.35
          const u = (t * speed + f.phase) % 1
          const k = Math.min(f.pts.length - 2, Math.floor(u * (f.pts.length - 1)))
          const [x, y] = P(f.pts[k], f, k)
          ctx.fillStyle = colour(1, 0.9 * I)
          ctx.beginPath()
          ctx.arc(x, y, 2.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // The core: a hot crescent with a dark heart, like the reference.
      const cr = R * 0.2 * breathe
      const g = ctx.createRadialGradient(cx - cr * 0.25, cy, cr * 0.2, cx, cy, cr * 2.4)
      g.addColorStop(0, `rgba(255,236,170,${0.85 * I})`)
      g.addColorStop(0.35, `rgba(255,170,40,${0.6 * I})`)
      g.addColorStop(1, 'rgba(255,90,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, cr * 2.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(14,12,10,0.85)'
      ctx.beginPath()
      ctx.ellipse(cx + cr * 0.25, cy, cr * 0.85, cr * 1.05, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = `rgba(255,236,170,${I})`
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.ellipse(cx + cr * 0.2, cy, cr * 0.95, cr * 1.12, 0, Math.PI * 0.55, Math.PI * 1.45)
      ctx.stroke()

      // Data tags.
      ctx.globalCompositeOperation = 'source-over'
      ctx.font = `${Math.max(9, R * 0.045)}px "IBM Plex Mono", monospace`
      ctx.textBaseline = 'middle'
      for (const tg of TAGS) {
        const x = cx + tg.x * R * 1.6
        const y = cy + tg.y * R * 1.3
        const w = ctx.measureText(tg.text).width + 14
        const h = Math.max(14, R * 0.08)
        ctx.fillStyle = 'rgba(20,16,12,0.78)'
        ctx.fillRect(x, y - h / 2, w, h)
        ctx.strokeStyle = colour(0.3, 0.8 * I)
        ctx.lineWidth = 1
        ctx.strokeRect(x + 0.5, y - h / 2 + 0.5, w - 1, h - 1)
        ctx.fillStyle = colour(0.85, 0.95 * Math.max(0.5, I))
        ctx.fillText(tg.text, x + 7, y + 0.5)
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [on])

  if (!on) return null
  return (
    <>
      <canvas ref={canvas} className="x-neural" aria-hidden="true" />
      <div className="x-frame" aria-hidden="true" />
      <div className="x-sun" aria-hidden="true" />
    </>
  )
}

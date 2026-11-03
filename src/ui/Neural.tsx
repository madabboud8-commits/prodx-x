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
  { x: -0.3, y: -0.5, text: 'DATASHEET · CLAIMS' },
  { x: 0.32, y: -0.32, text: 'SPEC CHECK  kW / W' },
  { x: -0.4, y: -0.04, text: 'SOURCE: BRAND > ALIBABA' },
  { x: 0.38, y: 0.1, text: 'NOISE  dB(A)' },
  { x: -0.32, y: 0.36, text: 'HEAT-UP  t(min)' },
  { x: 0.28, y: 0.56, text: 'RESULT ARCHIVE' },
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

/**
 * The red-orange plexus clusters above and below the core: dense node meshes
 * in two lobes, linked to their near neighbours so they read as triangles.
 */
const MESH = (() => {
  const r = rand(23)
  const pts: { x: number; y: number }[] = []
  for (const lobe of [-1, 1]) {
    for (let i = 0; i < 170; i++) {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r())
      pts.push({ x: Math.cos(a) * d * 0.42 + (r() - 0.5) * 0.1, y: lobe * (0.62 + Math.sin(a) * d * 0.38) })
    }
  }
  for (let i = 0; i < 90; i++) {
    const a = r() * Math.PI * 2
    const d = 0.38 + r() * 0.3
    pts.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 1.2 })
  }
  const links: [number, number][] = []
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x
      const dy = pts[i].y - pts[j].y
      if (dx * dx + dy * dy < 0.0105) links.push([i, j])
    }
  return { pts, links }
})()

/** Flame tongues licking off the core's edge. */
const EMBERS = (() => {
  const r = rand(91)
  return Array.from({ length: 420 }, () => ({
    a: r() * Math.PI * 2,
    len: 0.04 + Math.pow(r(), 2) * 0.32,
    w: 1 + r() * 3,
    ph: r() * Math.PI * 2,
    hue: r(),
  }))
})()

/** A jagged, burnt-paper outline for the core. */
const RIM = (() => {
  const r = rand(5)
  const raw = Array.from({ length: 96 }, () => (r() - 0.5) * 0.12)
  // Smooth the noise so the edge reads as burnt, not as gear teeth.
  return raw.map((_, i) => {
    const a = raw[(i + 95) % 96], b = raw[i], c = raw[(i + 1) % 96]
    return 1 + (a + b * 2 + c) / 4 + Math.sin(i * 0.26) * 0.03
  })
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

      // Fiery haze: the orange explosion behind everything.
      const hz = (x: number, y: number, rad: number, c: string, al: number) => {
        const hg = ctx.createRadialGradient(x, y, 0, x, y, rad)
        hg.addColorStop(0, c.replace('A', String(al)))
        hg.addColorStop(1, c.replace('A', '0'))
        ctx.fillStyle = hg
        ctx.beginPath()
        ctx.arc(x, y, rad, 0, Math.PI * 2)
        ctx.fill()
      }
      const flare = 1 + lvl * 0.8 + (busy ? 0.15 * Math.sin(t * 4) : 0)
      hz(cx, cy, R * 1.25 * flare, 'rgba(255,90,0,A)', 0.32 * I)
      hz(cx, cy - R * 0.55, R * 0.7 * flare, 'rgba(255,60,10,A)', 0.3 * I)
      hz(cx, cy + R * 0.6, R * 0.7 * flare, 'rgba(255,60,10,A)', 0.28 * I)
      hz(cx - R * 0.15, cy, R * 0.6 * flare, 'rgba(255,190,60,A)', 0.4 * I)

      // Red-orange plexus clusters.
      ctx.lineWidth = 0.9
      ctx.strokeStyle = `rgba(255,70,25,${0.42 * I})`
      ctx.beginPath()
      for (const [i, j] of MESH.links) {
        const p = MESH.pts[i]
        const q = MESH.pts[j]
        ctx.moveTo(cx + p.x * breathe * R, cy + p.y * breathe * R)
        ctx.lineTo(cx + q.x * breathe * R, cy + q.y * breathe * R)
      }
      ctx.stroke()
      for (const [k, p] of MESH.pts.entries()) {
        const tw = 0.6 + 0.4 * Math.sin(t * 2 + k)
        ctx.fillStyle = `rgba(255,${120 + (k % 5) * 25},40,${0.8 * I * tw})`
        ctx.beginPath()
        ctx.arc(cx + p.x * breathe * R, cy + p.y * breathe * R, k % 7 === 0 ? 2.4 : 1.3, 0, Math.PI * 2)
        ctx.fill()
      }

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

      // The core: a burning hole with a jagged, white-hot edge and flames
      // licking off it, like the reference.
      const cr = R * 0.34 * breathe * (1 + lvl * 0.1)
      const rimPath = (scale: number, jit: number) => {
        ctx.beginPath()
        RIM.forEach((rr, i) => {
          const a = (i / RIM.length) * Math.PI * 2
          const j = rr + Math.sin(t * 3 + i) * jit
          const x = cx + Math.cos(a) * cr * scale * j * 0.9
          const y = cy + Math.sin(a) * cr * scale * j * 1.08
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
      }
      // Flames.
      ctx.lineCap = 'round'
      for (const em of EMBERS) {
        const fl = 0.55 + 0.45 * Math.sin(t * (3 + em.hue * 4) + em.ph)
        const r0 = cr * 0.95
        const r1 = cr * (0.95 + em.len * fl * (1 + lvl * 1.2) * 2.2)
        const ca = Math.cos(em.a) * 0.9
        const sa = Math.sin(em.a) * 1.08
        ctx.strokeStyle = colour(em.hue * 0.9, 0.35 * I * fl)
        ctx.lineWidth = em.w * 2.2
        ctx.beginPath()
        ctx.moveTo(cx + ca * r0, cy + sa * r0)
        ctx.lineTo(cx + ca * r1, cy + sa * r1)
        ctx.stroke()
      }
      // Hot glow hugging the rim.
      const g = ctx.createRadialGradient(cx, cy, cr * 0.6, cx, cy, cr * 1.7)
      g.addColorStop(0, `rgba(255,240,180,${0.95 * I})`)
      g.addColorStop(0.45, `rgba(255,170,30,${0.7 * I})`)
      g.addColorStop(1, 'rgba(255,80,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, cr * 1.7, 0, Math.PI * 2)
      ctx.fill()
      // The hole: dark gold inside, not black.
      ctx.globalCompositeOperation = 'source-over'
      const hole = ctx.createRadialGradient(cx + cr * 0.2, cy, 0, cx, cy, cr)
      hole.addColorStop(0, 'rgba(40,28,10,0.96)')
      hole.addColorStop(0.75, 'rgba(70,46,12,0.93)')
      hole.addColorStop(1, 'rgba(150,90,20,0.9)')
      ctx.fillStyle = hole
      rimPath(0.92, 0.01)
      ctx.fill()
      // White-hot burning edge, brightest on the left like the reference.
      ctx.globalCompositeOperation = 'lighter'
      ctx.shadowColor = 'rgba(255,200,80,0.9)'
      ctx.shadowBlur = 24
      ctx.strokeStyle = `rgba(255,215,110,${0.85 * I})`
      ctx.lineWidth = 4
      rimPath(0.94, 0.012)
      ctx.stroke()
      const hot = ctx.createLinearGradient(cx - cr, cy, cx + cr, cy)
      hot.addColorStop(0, `rgba(255,252,225,${I})`)
      hot.addColorStop(0.5, `rgba(255,235,160,${0.6 * I})`)
      hot.addColorStop(1, 'rgba(255,200,90,0)')
      ctx.strokeStyle = hot
      ctx.lineWidth = 9
      rimPath(0.94, 0.012)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Data tags.
      ctx.globalCompositeOperation = 'source-over'
      ctx.font = `${Math.max(9, R * 0.045)}px "IBM Plex Mono", monospace`
      ctx.textBaseline = 'middle'
      for (const tg of TAGS) {
        const w = ctx.measureText(tg.text).width + 14
        const x = cx + tg.x * R * 1.6 - (tg.x < 0 ? w : 0)
        const y = cy + tg.y * R * 1.3
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

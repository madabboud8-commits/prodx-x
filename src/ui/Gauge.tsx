import { useMemo } from 'react'
import { useStore, accentFor, type Phase } from '../store'

/**
 * X's face: a measuring instrument instead of a glowing orb.
 *
 * PRODX is a testing lab, so X looks like the tools on the bench: a dial with
 * a tick scale, a needle-free level arc that follows the voice, and the X mark
 * in the middle. Crisp lines only, nothing organic. The scale turns slowly
 * while X is thinking or researching, and the arc fills with the audio level
 * while Imad talks or X speaks.
 */
const LABEL: Record<Phase, string> = {
  offline: 'OFFLINE',
  boot: 'STARTING',
  dormant: 'STANDBY',
  waking: 'READY',
  listening: 'LISTENING',
  thinking: 'THINKING',
  tooling: 'RESEARCHING',
  speaking: 'SPEAKING',
}

const R = 150
const TICKS = 72

export function Gauge() {
  const phase = useStore((s) => s.phase)
  const level = useStore((s) => s.level)
  const ui = useStore((s) => s.ui)
  const colour = accentFor(phase, ui)
  const r = ui.reactor

  const ticks = useMemo(
    () =>
      Array.from({ length: TICKS }, (_, i) => {
        const a = (i / TICKS) * Math.PI * 2
        const major = i % 6 === 0
        const r1 = R - (major ? 16 : 8)
        return {
          major,
          x1: Math.sin(a) * r1,
          y1: -Math.cos(a) * r1,
          x2: Math.sin(a) * R,
          y2: -Math.cos(a) * R,
        }
      }),
    [],
  )

  if (!r.visible || r.style !== 'gauge' || phase === 'offline' || phase === 'boot') return null

  const busy = phase === 'thinking' || phase === 'tooling'
  const live = phase === 'listening' || phase === 'speaking'
  const dim = phase === 'dormant'
  // Level arc: 270 degrees of travel, like a meter.
  const lv = live ? Math.max(0.04, Math.min(1, level * 1.6)) : busy ? 0.25 : 0.04
  const arcR = R - 30
  const circ = 2 * Math.PI * arcR
  const travel = 0.75
  const spin = busy ? 6 : 40

  return (
    <div className="x-gauge" style={{ ['--g' as string]: colour, transform: `translate(-50%, -50%) scale(${r.scale})`, opacity: (dim ? 0.55 : 1) * Math.min(1, r.intensity) }} aria-hidden="true">
      <svg viewBox="-170 -170 340 340">
        <circle className="x-g-ring" r={R + 8} />
        <g className="x-g-scale" style={{ animationDuration: `${spin / Math.max(0.2, r.spin)}s` }}>
          {ticks.map((t, i) => (
            <line key={i} className={t.major ? 'x-g-tick x-g-major' : 'x-g-tick'} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
          ))}
        </g>
        <circle className="x-g-track" r={arcR} strokeDasharray={`${circ * travel} ${circ}`} transform="rotate(135)" />
        <circle
          className="x-g-level"
          r={arcR}
          strokeDasharray={`${circ * travel * lv} ${circ}`}
          transform="rotate(135)"
        />
        <circle className="x-g-ring x-g-inner" r={78} />
        <path
          className="x-g-mark"
          d="M-34,-40 L-14,-40 L0,-16 L14,-40 L34,-40 L10,0 L34,40 L14,40 L0,16 L-14,40 L-34,40 L-10,0 Z"
        />
        <text className="x-g-label" y={R - 44}>{LABEL[phase]}</text>
      </svg>
    </div>
  )
}

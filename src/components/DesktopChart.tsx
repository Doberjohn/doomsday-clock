import { useState } from 'react'
import { useRovingFocus } from '../hooks/useRovingFocus.ts'
import { cx } from '../lib/cx.ts'
import { dotLabel } from '../lib/format.ts'
import type { ChartLayout } from '../lib/layout.ts'
import type { Watched } from '../lib/watched.ts'
import { Thread } from './Thread.tsx'
import { Tooltip } from './Tooltip.tsx'
import './Chart.css'

type Props = {
  layout: ChartLayout
  watched: Watched
  onOpen: (id: string) => void
  /** Hides the tooltip while the detail modal is up. */
  modalOpen: boolean
}

export function DesktopChart({ layout, watched, onOpen, modalOpen }: Props) {
  const [hover, setHover] = useState<string | null>(null)
  const { containerRef, tabbable, setActive, onKeyDown } = useRovingFocus(layout.sequence)
  const { width: W, height: H, positions } = layout
  // Only an entry still on the chart can be hovered; one that was just filtered out must not dim the rest.
  const hovered = layout.shown.find((e) => e.id === hover)
  const lit = hovered?.id ?? null

  return (
    <div
      ref={containerRef}
      className="chart"
      role="group"
      aria-label="Constellation chart. Arrow keys move between titles; Enter opens one."
    >
      <svg className="chart__svg" width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {layout.yGuides.map((g, i) => (
          <line key={i} className="guide" x1={0} x2={W} y1={g.pos} y2={g.pos} />
        ))}
        {layout.xGuides.map((g, i) => (
          <line key={i} className="guide guide--dashed guide--slide" x1={0} x2={0} y1={0} y2={H} style={{ transform: `translateX(${g.pos}px)` }} />
        ))}
        <Thread layout={layout} axis="y" hover={lit} />
      </svg>

      {layout.yGuides.map((g, i) => (
        <div key={i} className="guide-label guide-label--left" style={{ top: `${(g.pos / H) * 100}%` }} aria-hidden="true">
          {g.label}
        </div>
      ))}
      {layout.xGuides.map((g, i) => (
        <div key={i} className="guide-label guide-label--bottom" style={{ left: `${(g.pos / W) * 100}%` }} aria-hidden="true">
          {g.label}
        </div>
      ))}

      {layout.shown.map((e) => {
        const p = positions.get(e.id)!
        const isLit = lit === e.id
        return (
          <button
            key={e.id}
            type="button"
            data-id={e.id}
            className={cx(
              'dot',
              `t-${e.type}`,
              e.type === 'film' && 'dot--film',
              e.alt && 'dot--alt',
              watched[e.id] && 'dot--watched',
              isLit && 'dot--lit',
              lit && !isLit && 'dot--dim',
            )}
            style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%`, '--twinkle-delay': `${p.x % 3}s` }}
            tabIndex={tabbable === e.id ? 0 : -1}
            aria-label={dotLabel(e, !!watched[e.id])}
            onMouseEnter={() => setHover(e.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={(event) => {
              setActive(e.id)
              // Keyboard focus shows the tooltip too; focus returning after a mouse click shouldn't.
              if (event.currentTarget.matches(':focus-visible')) setHover(e.id)
            }}
            onBlur={() => setHover((h) => (h === e.id ? null : h))}
            onKeyDown={(event) => onKeyDown(event, e.id)}
            onClick={() => onOpen(e.id)}
          >
            <span className="dot__core" />
          </button>
        )
      })}

      {hovered && !modalOpen && (
        <Tooltip entry={hovered} at={positions.get(hovered.id)!} width={W} height={H} watched={!!watched[hovered.id]} />
      )}
      {layout.shown.length === 0 && <div className="chart__empty">no entries match</div>}
    </div>
  )
}

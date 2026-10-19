import { Fragment } from 'react'
import { useRovingFocus } from '../hooks/useRovingFocus.ts'
import { cx } from '../lib/cx.ts'
import { dotLabel } from '../lib/format.ts'
import type { ChartLayout } from '../lib/layout.ts'
import type { Watched } from '../lib/watched.ts'
import { Thread } from './Thread.tsx'
import './Chart.css'

type Props = { layout: ChartLayout; watched: Watched; onOpen: (id: string) => void }

/** Vertical chart: story order runs down the page, release date across, every dot labelled. */
export function MobileChart({ layout, watched, onOpen }: Props) {
  const { containerRef, tabbable, setActive, onKeyDown } = useRovingFocus(layout.sequence)
  const { width: W, height: H, positions } = layout

  return (
    <div
      ref={containerRef}
      className="m-chart"
      style={{ height: H }}
      role="group"
      aria-label="Constellation chart. Arrow keys move between titles; Enter opens one."
    >
      <svg className="chart__svg" width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {layout.xGuides.map((g, i) => (
          <line key={i} className="guide guide--dashed" x1={g.pos} x2={g.pos} y1={0} y2={H} />
        ))}
        {layout.yGuides.map((g, i) => (
          <line key={i} className="guide guide--faint guide--slide" x1={0} x2={W} y1={0} y2={0} style={{ transform: `translateY(${g.pos}px)` }} />
        ))}
        <Thread layout={layout} axis="x" />
      </svg>

      {layout.xGuides.map((g, i) => (
        <div key={i} className="guide-label guide-label--top" style={{ left: `${(g.pos / W) * 100}%` }} aria-hidden="true">
          {g.label}
        </div>
      ))}
      {layout.yGuides.map((g, i) => (
        <div key={i} className="guide-label guide-label--side" style={{ top: `${(g.pos / H) * 100}%` }} aria-hidden="true">
          {g.label}
        </div>
      ))}

      {layout.shown.map((e) => {
        const p = positions.get(e.id)!
        const x = (p.x / W) * 100
        const y = (p.y / H) * 100
        const isWatched = !!watched[e.id]
        // Label on whichever side has more room.
        const labelRight = p.x < W / 2
        return (
          <Fragment key={e.id}>
            <button
              type="button"
              data-id={e.id}
              className={cx('dot', 'dot--mobile', `t-${e.type}`, e.type === 'film' && 'dot--film', e.alt && 'dot--alt', isWatched && 'dot--watched')}
              style={{ left: `${x}%`, top: `${y}%`, '--twinkle-delay': `${p.y % 3}s` }}
              tabIndex={tabbable === e.id ? 0 : -1}
              aria-label={dotLabel(e, isWatched)}
              onFocus={() => setActive(e.id)}
              onKeyDown={(event) => onKeyDown(event, e.id)}
              onClick={() => onOpen(e.id)}
            >
              <span className="dot__core" />
            </button>
            <div
              className={cx('m-label', isWatched && 'm-label--watched')}
              style={
                labelRight
                  ? { top: `${y}%`, left: `calc(${x}% + 18px)`, textAlign: 'left' }
                  : { top: `${y}%`, right: `calc(${100 - x}% + 18px)`, textAlign: 'right' }
              }
              aria-hidden="true"
              onClick={() => onOpen(e.id)}
            >
              {e.t}
            </div>
          </Fragment>
        )
      })}

      {layout.shown.length === 0 && <div className="chart__empty">no entries match</div>}
    </div>
  )
}

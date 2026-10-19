import { tmdb } from '../data/tmdb.ts'
import type { Entry } from '../data/types.ts'
import { phaseLabel, setIn, tooltipHint, TYPE_LABEL } from '../lib/format.ts'
import type { Point } from '../lib/layout.ts'
import { posterUrl } from '../lib/tmdb.ts'

type Props = { entry: Entry; at: Point; width: number; height: number; watched: boolean }

/** Hover card beside a dot; flips left on the right of the chart and below near the top. */
export function Tooltip({ entry: e, at, width, height, watched }: Props) {
  const flipLeft = at.x > width * 0.6
  const flipDown = at.y < height * 0.4
  const thumb = posterUrl(tmdb[e.id], 'w185')
  const phase = phaseLabel(e)
  return (
    <div
      className={`tooltip t-${e.type}`}
      aria-hidden="true"
      style={{
        left: `${(at.x / width) * 100}%`,
        top: `${(at.y / height) * 100}%`,
        transform: `translate(${flipLeft ? 'calc(-100% - 18px)' : '18px'}, ${flipDown ? '18px' : 'calc(-100% - 18px)'})`,
      }}
    >
      {thumb && <img className="tooltip__thumb" src={thumb} alt="" width={64} height={96} />}
      <div className="tooltip__text">
        <div className="tooltip__kicker">
          {TYPE_LABEL[e.type]}
          {phase && ` · ${phase}`}
        </div>
        <div className="tooltip__title">{e.t}</div>
        <div className="tooltip__meta">
          <span>set {setIn(e)}</span>
          <span>out {e.rel.slice(0, 4)}</span>
          <span>{e.run}</span>
        </div>
        <div className="tooltip__hint">{tooltipHint(e, watched)} · click for details</div>
      </div>
    </div>
  )
}

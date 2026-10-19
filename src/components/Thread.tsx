import { useTweenedPositions } from '../hooks/useTweenedPositions.ts'
import { cx } from '../lib/cx.ts'
import { altLinkPath, curve, type ChartLayout } from '../lib/layout.ts'

type Props = {
  layout: ChartLayout
  /** Axis the alternate-universe branches bend along: y on desktop, x on mobile. */
  axis: 'x' | 'y'
  /** Hovered entry; lights the branches touching it and dims the rest. */
  hover?: string | null
}

/** The Sacred Timeline (glow, base stroke, travelling pulse) and dashed branches to alternate universes. */
export function Thread({ layout, axis, hover = null }: Props) {
  const pos = useTweenedPositions(layout.positions)
  const d = curve(layout.thread.flatMap((id) => pos.get(id) ?? []))
  return (
    <>
      <path className="thread thread--glow" d={d} />
      <path className="thread thread--base" d={d} />
      <path className="thread thread--pulse" d={d} />
      {layout.altLinks.map(({ id, anchor }) => {
        const from = pos.get(anchor)
        const to = pos.get(id)
        if (!from || !to) return null
        const lit = hover === id || hover === anchor
        return (
          <path
            key={id}
            className={cx('alt-link', axis === 'x' && 'alt-link--mobile', lit && 'alt-link--lit', hover && !lit && 'alt-link--dim')}
            d={altLinkPath(from, to, axis)}
          />
        )
      })}
    </>
  )
}

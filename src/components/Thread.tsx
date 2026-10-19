import { useTweenedPositions } from '../hooks/useTweenedPositions.ts'
import { cx } from '../lib/cx.ts'
import { altLinkPath, curve, polyline, type ChartLayout } from '../lib/layout.ts'

type Props = {
  layout: ChartLayout
  /** Axis the alternate-universe branches bend along: y on desktop, x on mobile. */
  axis: 'x' | 'y'
  /** Hovered entries; lights the branches and lines touching them and dims the rest. */
  hover?: readonly string[]
}

/** The Sacred Timeline (glow, base stroke, travelling pulse), dashed branches to alternate universes,
 *  and the dashed thread of each alternate line (e.g. the X-Men films), drawn straight so it never swings past a title. */
export function Thread({ layout, axis, hover = [] }: Props) {
  const pos = useTweenedPositions(layout.positions)
  const d = curve(layout.thread.flatMap((id) => pos.get(id) ?? []))
  // A line lights up as a whole: any of its titles, or the title it branches from, being hovered.
  const lineOf = new Map(layout.lines.map((ids) => [ids[0], ids]))
  const anchorOf = new Map(layout.altLinks.map(({ id, anchor }) => [id, anchor]))
  const touches = (ids: readonly string[], anchor?: string) => ids.some((id) => hover.includes(id)) || (!!anchor && hover.includes(anchor))
  const state = (lit: boolean, base: string) =>
    cx(base, axis === 'x' && `${base}--mobile`, lit && `${base}--lit`, hover.length > 0 && !lit && `${base}--dim`)

  return (
    <>
      <path className="thread thread--glow" d={d} />
      <path className="thread thread--base" d={d} />
      <path className="thread thread--pulse" d={d} />
      {layout.altLinks.map(({ id, anchor }) => {
        const from = pos.get(anchor)
        const to = pos.get(id)
        if (!from || !to) return null
        return <path key={id} className={state(touches(lineOf.get(id) ?? [id], anchor), 'alt-link')} d={altLinkPath(from, to, axis)} />
      })}
      {layout.lines.map((ids) => (
        <path key={ids[0]} className={state(touches(ids, anchorOf.get(ids[0])), 'alt-line')} d={polyline(ids.flatMap((id) => pos.get(id) ?? []))} />
      ))}
    </>
  )
}

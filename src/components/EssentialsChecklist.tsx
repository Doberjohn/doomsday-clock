import { useId, useState } from 'react'
import { cx } from '../lib/cx.ts'
import { isWatched, nextUp, type Essential } from '../lib/essentials.ts'
import type { Watched } from '../lib/watched.ts'
import './EssentialsChecklist.css'

type Props = {
  items: readonly Essential[]
  watched: Watched
  onToggle: (item: Essential) => void
  onOpen: (id: string) => void
  /** Lights the dots of the line under the pointer or focus (desktop). */
  onSpotlight?: (ids: readonly string[] | null) => void
  /** Phone layout: a bar that opens into the list. */
  collapsible?: boolean
}

/** Disney's essentials to watch before Avengers: Doomsday, ticked off with the site's watched marks. */
export function EssentialsChecklist({ items, watched, onToggle, onOpen, onSpotlight, collapsible = false }: Props) {
  const [open, setOpen] = useState(!collapsible)
  const titleId = useId()
  const listId = useId()
  const done = items.filter((item) => isWatched(item, watched)).length
  const next = nextUp(items, watched)

  const summary = (
    <>
      <span id={titleId} className="essentials__title">
        Essentials before Doomsday
      </span>
      <span className="essentials__track" aria-hidden="true">
        <span className="essentials__bar" style={{ width: `${(done / items.length) * 100}%` }} />
      </span>
      <span className="essentials__count">
        {done} / {items.length}
        <span className="sr-only"> watched</span>
      </span>
    </>
  )

  return (
    <section className={cx('essentials', collapsible && 'essentials--collapsible')} aria-labelledby={titleId}>
      {collapsible ? (
        <button type="button" className="essentials__head" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)}>
          {summary}
          <span className="essentials__chevron" aria-hidden="true" />
        </button>
      ) : (
        <div className="essentials__head">{summary}</div>
      )}
      <ol id={listId} className="essentials__list" hidden={!open}>
        {items.map((item) => {
          const isDone = isWatched(item, watched)
          const isNext = item === next
          const spot = () => onSpotlight?.(item.ids)
          const unspot = () => onSpotlight?.(null)
          return (
            <li
              key={item.n}
              className={cx('essentials__item', isDone && 'essentials__item--done', isNext && 'essentials__item--next')}
              onMouseEnter={spot}
              onMouseLeave={unspot}
            >
              <button
                type="button"
                className="essentials__tick"
                aria-pressed={isDone}
                aria-label={`${item.title} watched`}
                onClick={() => onToggle(item)}
                onFocus={spot}
                onBlur={unspot}
              />
              <span className="essentials__num" aria-hidden="true">
                {item.n}
              </span>
              <button type="button" className="essentials__name" title={item.title} onClick={() => onOpen(item.ids[0])} onFocus={spot} onBlur={unspot}>
                {item.title}
                {isNext && <span className="sr-only"> (next up)</span>}
              </button>
              <span className="essentials__year">{item.years}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

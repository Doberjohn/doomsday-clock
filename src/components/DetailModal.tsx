import { useId, useLayoutEffect, useRef } from 'react'
import { tmdb } from '../data/tmdb.ts'
import type { Entry } from '../data/types.ts'
import { cx } from '../lib/cx.ts'
import { formatReleaseDate, phaseLabel, setIn, TYPE_LABEL } from '../lib/format.ts'
import { posterUrl, watchLink } from '../lib/tmdb.ts'
import './DetailModal.css'

const ALT_NOTE = 'Alternate universe or branched timeline; linked to the main thread by a dashed line.'

type Props = {
  entry: Entry
  /** Bottom sheet on mobile, centered card on desktop. */
  sheet: boolean
  watched: boolean
  storyRank: number
  releaseRank: number
  onToggleWatched: () => void
  onClose: () => void
}

/** A native modal <dialog>: it traps focus, makes the page inert and closes on Esc. */
export function DetailModal({ entry: e, sheet, watched, storyRank, releaseRank, onToggleWatched, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pressedBackdrop = useRef(false)
  const titleId = useId()

  useLayoutEffect(() => {
    const dialog = dialogRef.current!
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
      opener?.focus()
    }
  }, [])

  const match = tmdb[e.id]
  const poster = posterUrl(match, 'w342')
  const link = watchLink(e, match)
  const note = e.note || (e.alt ? ALT_NOTE : '')

  return (
    <dialog
      ref={dialogRef}
      className={cx('modal', sheet && 'modal--sheet')}
      aria-labelledby={titleId}
      // Esc closes the dialog natively; sync state. The `open` check skips the close() made on unmount.
      onClose={() => {
        if (!dialogRef.current?.open) onClose()
      }}
      // Close on a click that both starts and ends on the backdrop, not on a drag out of the card.
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget) onClose()
      }}
    >
      <div className={cx('modal__card', `t-${e.type}`, poster && 'modal__card--poster')}>
        <button type="button" className="modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        {poster && <img className="modal__poster" src={poster} alt="" width={220} height={330} />}
        <div className="modal__head">
          <div className="modal__kicker">
            <span className="modal__dot" aria-hidden="true" />
            <span>{TYPE_LABEL[e.type]}</span>
            <span className="modal__phase">{phaseLabel(e)}</span>
          </div>
          <h2 id={titleId} className="modal__title">
            {e.t}
          </h2>
        </div>
        <div className="modal__body">
          <p className="modal__synopsis">{e.syn}</p>
          <dl className="modal__facts">
            <div>
              <dt>set in</dt>
              <dd>{setIn(e)}</dd>
            </div>
            <div>
              <dt>released</dt>
              <dd>{formatReleaseDate(e.rel)}</dd>
            </div>
            <div>
              <dt>length</dt>
              <dd>{e.run}</dd>
            </div>
            <div>
              <dt>watch on</dt>
              <dd>
                {link ? (
                  <a className="modal__link" href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label} ↗
                  </a>
                ) : (
                  e.watch
                )}
              </dd>
            </div>
          </dl>
          {note && <p className="modal__note">{note}</p>}
          <div className="modal__actions">
            <button type="button" className="modal__watch" aria-pressed={watched} onClick={onToggleWatched}>
              {watched ? '✓ watched' : 'mark watched'}
            </button>
            <span className="modal__rank">
              #{storyRank} in story · #{releaseRank} released
            </span>
          </div>
        </div>
      </div>
    </dialog>
  )
}

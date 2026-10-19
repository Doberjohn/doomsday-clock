import type { Entry } from '../data/types.ts'
import { formatReleaseDate, phaseLabel, setIn, TYPE_LABEL } from '../lib/format.ts'
import type { Mode } from '../lib/layout.ts'
import type { Watched } from '../lib/watched.ts'

/** The chart as a plain ordered list, for screen readers. */
export function EntryList({ sequence, mode, watched }: { sequence: readonly Entry[]; mode: Mode; watched: Watched }) {
  return (
    <section className="sr-only" aria-labelledby="entry-list-title">
      <h2 id="entry-list-title">{mode === 'chrono' ? 'Titles in story order' : 'Titles in release order'}</h2>
      <ol>
        {sequence.map((e) => (
          <li key={e.id}>
            {e.t}. {TYPE_LABEL[e.type]}, {phaseLabel(e)}. Set {setIn(e)}. Released {formatReleaseDate(e.rel)}.
            {watched[e.id] ? ' Watched.' : ''}
          </li>
        ))}
      </ol>
    </section>
  )
}

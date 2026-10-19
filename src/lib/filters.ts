import type { Entry, EntryType } from '../data/types.ts'

export type Filters = { types: ReadonlySet<EntryType>; phases: ReadonlySet<string>; query: string }

/** Empty sets mean "everything"; active filters combine with AND. */
export function matchesFilters(e: Entry, { types, phases, query }: Filters): boolean {
  const q = query.trim().toLowerCase()
  return (
    (types.size === 0 || types.has(e.type)) &&
    (phases.size === 0 || phases.has(String(e.ph))) &&
    (!q || e.t.toLowerCase().includes(q))
  )
}

/** The entries on the chart: the Fox X-Men films only load when their toggle is on, except the Doomsday essentials. */
export function loadedEntries(entries: readonly Entry[], fox: boolean): Entry[] {
  return fox ? [...entries] : entries.filter((e) => !e.fox || e.essential !== undefined)
}

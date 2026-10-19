import type { Entry, EntryType } from '../data/types.ts'

export const TYPE_LABEL: Record<EntryType, string> = {
  film: 'Film',
  series: 'Series',
  special: 'Special',
  short: 'One-Shot',
  animated: 'Animated',
}
export const TYPES = Object.keys(TYPE_LABEL) as EntryType[]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const NETWORKS = { netflix: 'Netflix', abc: 'ABC', hulu: 'Hulu' } as const

/** "2017-11-03" → "Nov 3, 2017" */
export function formatReleaseDate(rel: string): string {
  const [year, month, day] = rel.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

/** "Phase 3" for Marvel Studios titles, the network for non-Studios shows, "Fox" for the X-Men films. */
export function phaseLabel(e: Entry): string {
  if (e.ph) return `Phase ${e.ph}`
  if (e.canon) return NETWORKS[e.canon]
  return e.fox ? 'Fox' : ''
}

/** When the story is set: the display override, else the in-universe year. */
export function setIn(e: Entry): string {
  return e.yl || String(e.year)
}

/** Accessible name for a chart dot. */
export function dotLabel(e: Entry, watched: boolean): string {
  return `${e.t}, ${TYPE_LABEL[e.type]}, ${e.rel.slice(0, 4)}${watched ? ', watched' : ''}`
}

export function tooltipHint(e: Entry, watched: boolean): string {
  if (e.alt) return 'alternate universe'
  if (e.disputed) return 'disputed placement'
  return watched ? 'watched' : 'unwatched'
}

import type { Entry } from '../data/types.ts'
import type { Watched } from './watched.ts'

/** One line of Disney's essentials list: a title, or the seasons of one show sharing a number. */
export type Essential = { n: number; ids: string[]; title: string; years: string }

const SEASON = / S(\d+)$/

/** "Loki S1" + "Loki S2" → "Loki, seasons 1 and 2". */
function lineTitle(seasons: readonly Entry[]): string {
  if (seasons.length === 1) return seasons[0].t
  const numbers = seasons.map((e) => e.t.match(SEASON)?.[1] ?? '?')
  return `${seasons[0].t.replace(SEASON, '')}, seasons ${numbers.slice(0, -1).join(', ')} and ${numbers.at(-1)}`
}

/** "2021", or "2021–23" across seasons. */
function lineYears(seasons: readonly Entry[]): string {
  const first = seasons[0].rel.slice(0, 4)
  const last = seasons[seasons.length - 1].rel.slice(0, 4)
  return first === last ? first : `${first}–${last.slice(2)}`
}

/** Disney's essentials in list order, each show's seasons grouped in release order. */
export function essentialsList(entries: readonly Entry[]): Essential[] {
  const lines = new Map<number, Entry[]>()
  for (const e of entries) {
    if (e.essential === undefined) continue
    lines.set(e.essential, [...(lines.get(e.essential) ?? []), e])
  }
  return [...lines]
    .sort(([a], [b]) => a - b)
    .map(([n, line]) => {
      const seasons = [...line].sort((a, b) => a.rel.localeCompare(b.rel))
      return { n, ids: seasons.map((e) => e.id), title: lineTitle(seasons), years: lineYears(seasons) }
    })
}

/** A line counts as watched once every season of it is. */
export const isWatched = (item: Essential, watched: Watched) => item.ids.every((id) => watched[id])

/** The first line not yet watched, or null once the list is done. */
export const nextUp = (items: readonly Essential[], watched: Watched) => items.find((item) => !isWatched(item, watched)) ?? null

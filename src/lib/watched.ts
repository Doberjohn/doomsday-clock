/** Watched titles as an id → 1 map, the shape stored in localStorage. */
export type Watched = Record<string, 1>

export const WATCHED_KEY = 'mcu-watched'

export function parseWatched(raw: string | null): Watched {
  if (!raw) return {}
  try {
    const value: unknown = JSON.parse(raw)
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Watched) : {}
  } catch {
    return {}
  }
}

export function toggleWatched(watched: Watched, id: string): Watched {
  const next = { ...watched }
  if (next[id]) delete next[id]
  else next[id] = 1
  return next
}

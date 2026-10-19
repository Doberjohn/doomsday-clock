import { useCallback, useEffect, useState } from 'react'
import { parseWatched, setWatched, toggleWatched, WATCHED_KEY, type Watched } from '../lib/watched.ts'

/** Watched titles, persisted to localStorage (storage can be unavailable, e.g. in private modes). */
export function useWatched(): [Watched, (id: string) => void, (ids: readonly string[], on: boolean) => void] {
  const [watched, update] = useState<Watched>(() => {
    try {
      return parseWatched(localStorage.getItem(WATCHED_KEY))
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(WATCHED_KEY, JSON.stringify(watched))
    } catch {
      // Not persisted; the in-memory state still works for this visit.
    }
  }, [watched])

  const toggle = useCallback((id: string) => update((w) => toggleWatched(w, id)), [])
  const mark = useCallback((ids: readonly string[], on: boolean) => update((w) => setWatched(w, ids, on)), [])
  return [watched, toggle, mark]
}

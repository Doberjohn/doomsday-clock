import { useCallback, useEffect, useState } from 'react'
import { parseWatched, toggleWatched, WATCHED_KEY, type Watched } from '../lib/watched.ts'

/** Watched titles, persisted to localStorage (storage can be unavailable, e.g. in private modes). */
export function useWatched(): [Watched, (id: string) => void] {
  const [watched, setWatched] = useState<Watched>(() => {
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

  const toggle = useCallback((id: string) => setWatched((w) => toggleWatched(w, id)), [])
  return [watched, toggle]
}

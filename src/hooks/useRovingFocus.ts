import { useRef, useState, type KeyboardEvent } from 'react'
import type { Entry } from '../data/types.ts'
import { stepFocus } from '../lib/nav.ts'

/**
 * One tab stop for the whole chart; arrow keys, Home and End move between dots in reading order.
 * Dots carry `data-id` so focus can be moved without a ref per dot.
 */
export function useRovingFocus(sequence: readonly Entry[]) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<string | null>(null)
  const ids = sequence.map((e) => e.id)
  const tabbable = active !== null && ids.includes(active) ? active : (ids[0] ?? null)

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, id: string) => {
    const next = stepFocus(ids, id, event.key)
    if (next === null) return
    event.preventDefault()
    setActive(next)
    containerRef.current?.querySelector<HTMLElement>(`[data-id="${next}"]`)?.focus()
  }

  return { containerRef, tabbable, setActive, onKeyDown }
}

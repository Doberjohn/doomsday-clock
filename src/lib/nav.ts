/** Next id to focus when `key` is pressed on `current`, moving along `ids`; null for keys that don't navigate. */
export function stepFocus(ids: readonly string[], current: string, key: string): string | null {
  const i = ids.indexOf(current)
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return ids[i < 0 ? 0 : Math.min(i + 1, ids.length - 1)] ?? null
    case 'ArrowLeft':
    case 'ArrowUp':
      return ids[Math.max(i - 1, 0)] ?? null
    case 'Home':
      return ids[0] ?? null
    case 'End':
      return ids[ids.length - 1] ?? null
    default:
      return null
  }
}

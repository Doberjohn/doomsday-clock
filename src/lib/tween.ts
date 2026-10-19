import type { Point } from './layout.ts'

/** CSS cubic-bezier() timing function. x is monotonic for valid curves, so bisection finds the parameter. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  // One Bézier component with P0 = 0 and P3 = 1.
  const at = (s: number, p1: number, p2: number) => 3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s ** 2 * p2 + s ** 3
  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    let lo = 0
    let hi = 1
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2
      if (at(mid, x1, x2) < t) lo = mid
      else hi = mid
    }
    return at((lo + hi) / 2, y1, y2)
  }
}

/** Positions `k` of the way from `from` to `to`. Points new to `to` start at their destination. */
export function lerpPositions(
  from: ReadonlyMap<string, Point>,
  to: ReadonlyMap<string, Point>,
  k: number,
): Map<string, Point> {
  const out = new Map<string, Point>()
  for (const [id, b] of to) {
    const a = from.get(id)
    out.set(id, a ? { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k } : b)
  }
  return out
}

import { useEffect, useState } from 'react'
import type { Point } from '../lib/layout.ts'
import { cubicBezier, lerpPositions } from '../lib/tween.ts'
import { REDUCED_MOTION, useMediaQuery } from './useMediaQuery.ts'

const DURATION = 700
const EASE = cubicBezier(0.2, 0.8, 0.2, 1)

const moves = (from: ReadonlyMap<string, Point>, to: ReadonlyMap<string, Point>) =>
  [...to].some(([id, b]) => {
    const a = from.get(id)
    return a !== undefined && (a.x !== b.x || a.y !== b.y)
  })

/**
 * Positions that glide to `target` over 0.7s on the same curve as the dots' CSS transition, so paths
 * drawn through them stay attached to the dots. (CSS can't transition an SVG path's `d` in every browser.)
 */
export function useTweenedPositions(target: ReadonlyMap<string, Point>): ReadonlyMap<string, Point> {
  const reduced = useMediaQuery(REDUCED_MOTION)
  const [drawn, setDrawn] = useState(target)
  const [tween, setTween] = useState({ from: target, to: target })

  if (tween.to !== target) {
    // New destination: start from what is on screen. Points that just appeared start at their destination.
    const from = lerpPositions(drawn, target, 0)
    const animate = !reduced && moves(from, target)
    setTween({ from: animate ? from : target, to: target })
    setDrawn(animate ? from : target)
  }

  useEffect(() => {
    const { from, to } = tween
    if (from === to) return
    const start = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - start) / DURATION)
      setDrawn(t < 1 ? lerpPositions(from, to, EASE(t)) : to)
      if (t < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [tween])

  return drawn
}

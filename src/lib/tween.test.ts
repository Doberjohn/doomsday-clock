import { describe, expect, it } from 'vitest'
import { cubicBezier, lerpPositions } from './tween.ts'

describe('cubicBezier', () => {
  const ease = cubicBezier(0.2, 0.8, 0.2, 1)

  it('pins both ends', () => {
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
  })

  it('front-loads the motion like the CSS curve', () => {
    // Solved by hand: x(s) = 0.5 at s ≈ 0.7245, where y(s) ≈ 0.946.
    expect(ease(0.5)).toBeCloseTo(0.946, 2)
  })

  it('is the identity for a linear curve', () => {
    expect(cubicBezier(0, 0, 1, 1)(0.3)).toBeCloseTo(0.3, 5)
  })
})

describe('lerpPositions', () => {
  it('interpolates points present in both maps', () => {
    const from = new Map([['a', { x: 0, y: 10 }]])
    const to = new Map([['a', { x: 100, y: 30 }]])
    expect(lerpPositions(from, to, 0.25).get('a')).toEqual({ x: 25, y: 15 })
  })

  it('places new points at their destination', () => {
    const to = new Map([['b', { x: 7, y: 9 }]])
    expect(lerpPositions(new Map(), to, 0.5).get('b')).toEqual({ x: 7, y: 9 })
  })

  it('drops points that are gone from the destination', () => {
    const from = new Map([['a', { x: 0, y: 0 }]])
    expect(lerpPositions(from, new Map(), 0.5).has('a')).toBe(false)
  })
})

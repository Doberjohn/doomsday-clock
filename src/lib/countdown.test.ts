import { describe, expect, it } from 'vitest'
import { countdown } from './countdown.ts'

const target = new Date('2026-12-18T05:00:00Z')
const at = (iso: string) => countdown(new Date(iso), target)
const zero = { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }

describe('countdown', () => {
  it('counts whole calendar months first, then splits the remainder', () => {
    expect(at('2026-10-19T12:00:00Z')).toEqual({ months: 1, days: 28, hours: 17, minutes: 0, seconds: 0 })
  })

  it('reproduces the reading in the design capture', () => {
    expect(at('2026-10-19T09:06:59Z')).toEqual({ months: 1, days: 28, hours: 19, minutes: 53, seconds: 1 })
  })

  it('backs off a month when adding it would overshoot the target', () => {
    // Nov 20 + 1 month = Dec 20, past Dec 18, so zero months and 28 days remain.
    expect(at('2026-11-20T05:00:00Z')).toEqual({ ...zero, days: 28 })
  })

  it('counts months across a year boundary', () => {
    expect(at('2025-12-20T05:00:00Z')).toEqual({ ...zero, months: 11, days: 28 })
  })

  it('splits the final day into hours, minutes and seconds', () => {
    expect(at('2026-12-18T03:58:30Z')).toEqual({ ...zero, hours: 1, minutes: 1, seconds: 30 })
  })

  it('floors partial seconds', () => {
    expect(at('2026-12-18T04:59:59.500Z')).toEqual(zero)
  })

  it('holds at zero at and after the target', () => {
    expect(countdown(target, target)).toEqual(zero)
    expect(at('2027-01-01T00:00:00Z')).toEqual(zero)
  })
})

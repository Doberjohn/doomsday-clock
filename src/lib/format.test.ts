import { describe, expect, it } from 'vitest'
import type { Entry } from '../data/types.ts'
import { dotLabel, formatReleaseDate, phaseLabel, setIn, tooltipHint } from './format.ts'

const entry = (extra: Partial<Entry> = {}): Entry => ({
  o: 1, id: 'x', t: 'X', type: 'film', ph: 3, year: 2017, rel: '2017-11-03', run: '1', watch: 'Disney+', syn: '', ...extra,
})

describe('formatReleaseDate', () => {
  it('writes the short month, unpadded day and year', () => {
    expect(formatReleaseDate('2017-11-03')).toBe('Nov 3, 2017')
    expect(formatReleaseDate('2026-01-27')).toBe('Jan 27, 2026')
  })
})

describe('phaseLabel', () => {
  it('names the phase for Marvel Studios titles', () => {
    expect(phaseLabel(entry({ ph: 3 }))).toBe('Phase 3')
  })

  it('names the network for non-Studios shows', () => {
    expect(phaseLabel(entry({ ph: 0, canon: 'netflix' }))).toBe('Netflix')
    expect(phaseLabel(entry({ ph: 0, canon: 'abc' }))).toBe('ABC')
    expect(phaseLabel(entry({ ph: 0, canon: 'hulu' }))).toBe('Hulu')
  })

  it('labels the Fox X-Men films', () => {
    expect(phaseLabel(entry({ ph: 0, fox: true }))).toBe('Fox')
  })
})

describe('setIn', () => {
  it('prefers the display override over the sort year', () => {
    expect(setIn(entry({ year: 1943, yl: '1942 – 1945' }))).toBe('1942 – 1945')
    expect(setIn(entry({ year: 2017 }))).toBe('2017')
  })
})

describe('dotLabel', () => {
  it('names the title, type and release year, and says when it is watched', () => {
    expect(dotLabel(entry({ t: 'Thor: Ragnarok' }), false)).toBe('Thor: Ragnarok, Film, 2017')
    expect(dotLabel(entry({ t: 'Agent Carter', type: 'short' }), true)).toBe('Agent Carter, One-Shot, 2017, watched')
  })

  it('says when the title is one of the Doomsday essentials', () => {
    expect(dotLabel(entry({ t: 'Thor: Ragnarok', essential: 5 }), true)).toBe('Thor: Ragnarok, Film, 2017, Doomsday essential 5, watched')
  })
})

describe('tooltipHint', () => {
  it('flags alternate universes first, then disputed placements, then watched state', () => {
    expect(tooltipHint(entry({ alt: true, disputed: true }), true)).toBe('alternate universe')
    expect(tooltipHint(entry({ disputed: true }), true)).toBe('disputed placement')
    expect(tooltipHint(entry(), true)).toBe('watched')
    expect(tooltipHint(entry(), false)).toBe('unwatched')
  })
})

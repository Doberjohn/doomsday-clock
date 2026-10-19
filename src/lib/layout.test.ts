import { describe, expect, it } from 'vitest'
import { entries } from '../data/entries.ts'
import type { Entry } from '../data/types.ts'
import { loadedEntries } from './filters.ts'
import { altLinkPath, curve, desktopLayout, mobileLayout, polyline, type ChartLayout } from './layout.ts'

const entry = (id: string, o: number, rel: string, year: number, extra: Partial<Entry> = {}): Entry => ({
  o, id, t: id, type: 'film', ph: 1, year, rel, run: '100 min', watch: 'Disney+', syn: '', ...extra,
})

// Story order A B C D; release order B A D C. C is an alternate-universe title.
const A = entry('a', 1, '2010-05-01', 2010)
const B = entry('b', 2, '2008-05-01', 2012, { type: 'series' })
const C = entry('c', 3, '2012-05-01', 2012, { alt: true })
const D = entry('d', 4, '2011-05-01', 2014)
const data = [A, B, C, D]

// Three alternates on one line, woven into story order: A L1 B L2 C L3 D.
const L1 = entry('l1', 1.5, '2014-01-01', 2011, { alt: true, line: 'x' })
const L2 = entry('l2', 2.5, '2015-01-01', 2012, { alt: true, line: 'x', branchFrom: 'a' })
const L3 = entry('l3', 3.5, '2016-01-01', 2013, { alt: true, line: 'x' })
const withLine = [...data, L1, L2, L3]

const everything = () => true
const hiding = (...ids: string[]) => (e: Entry) => !ids.includes(e.id)
const x = (l: ChartLayout, id: string) => l.positions.get(id)!.x
const y = (l: ChartLayout, id: string) => l.positions.get(id)!.y

describe('desktopLayout', () => {
  it('spreads x across the story order in chrono mode', () => {
    const l = desktopLayout(data, 'chrono', everything)
    expect(x(l, 'a')).toBeCloseTo(40)
    expect(x(l, 'b')).toBeCloseTo(413.333)
    expect(x(l, 'c')).toBeCloseTo(786.667)
    expect(x(l, 'd')).toBeCloseTo(1160)
  })

  it('spreads x across the release order in release mode', () => {
    const l = desktopLayout(data, 'release', everything)
    expect(x(l, 'b')).toBeCloseTo(40)
    expect(x(l, 'a')).toBeCloseTo(413.333)
    expect(x(l, 'd')).toBeCloseTo(786.667)
    expect(x(l, 'c')).toBeCloseTo(1160)
  })

  it('always places y by release order, earliest at the bottom', () => {
    for (const mode of ['chrono', 'release'] as const) {
      const l = desktopLayout(data, mode, everything)
      expect(y(l, 'b')).toBeCloseTo(560)
      expect(y(l, 'a')).toBeCloseTo(386.667)
      expect(y(l, 'd')).toBeCloseTo(213.333)
      expect(y(l, 'c')).toBeCloseTo(40)
    }
  })

  it('keeps every slot when entries are filtered out, so dots never shift', () => {
    const l = desktopLayout(data, 'chrono', hiding('a'))
    expect(l.shown.map((e) => e.id)).toEqual(['b', 'c', 'd'])
    expect(l.positions.has('a')).toBe(false)
    expect(x(l, 'b')).toBeCloseTo(413.333)
    expect(y(l, 'b')).toBeCloseTo(560)
  })

  it('lists visible entries in the current x-order', () => {
    expect(desktopLayout(data, 'chrono', hiding('c')).sequence.map((e) => e.id)).toEqual(['a', 'b', 'd'])
    expect(desktopLayout(data, 'release', hiding('c')).sequence.map((e) => e.id)).toEqual(['b', 'a', 'd'])
  })

  it('threads visible main-timeline entries in story order, skipping alternates', () => {
    expect(desktopLayout(data, 'chrono', everything).thread).toEqual(['a', 'b', 'd'])
    expect(desktopLayout(data, 'release', everything).thread).toEqual(['a', 'b', 'd'])
    expect(desktopLayout(data, 'chrono', hiding('b')).thread).toEqual(['a', 'd'])
  })

  it('anchors each alternate to the nearest preceding visible main-timeline entry', () => {
    expect(desktopLayout(data, 'chrono', everything).altLinks).toEqual([{ id: 'c', anchor: 'b' }])
    expect(desktopLayout(data, 'chrono', hiding('b')).altLinks).toEqual([{ id: 'c', anchor: 'a' }])
    expect(desktopLayout(data, 'chrono', hiding('a', 'b')).altLinks).toEqual([])
  })

  it('branches an alternate from the title it names, or the nearest one while that title is hidden', () => {
    const E = entry('e', 5, '2013-05-01', 2015, { alt: true, branchFrom: 'a' })
    expect(desktopLayout([...data, E], 'chrono', everything).altLinks).toContainEqual({ id: 'e', anchor: 'a' })
    expect(desktopLayout([...data, E], 'chrono', hiding('a')).altLinks).toContainEqual({ id: 'e', anchor: 'd' })
  })

  it('never anchors an alternate to another alternate', () => {
    const C2 = entry('c2', 3.5, '2013-01-01', 2012, { alt: true })
    expect(desktopLayout([...data, C2], 'chrono', everything).altLinks).toEqual([
      { id: 'c', anchor: 'b' },
      { id: 'c2', anchor: 'b' },
    ])
  })

  it('joins alternates on one line into a thread in story order, branching only from the first', () => {
    const l = desktopLayout(withLine, 'chrono', everything)
    expect(l.lines).toEqual([['l1', 'l2', 'l3']])
    expect(l.altLinks).toEqual([
      { id: 'l1', anchor: 'a' },
      { id: 'c', anchor: 'b' },
    ])
  })

  it("branches a line from its first visible member, from the title that member names", () => {
    const l = desktopLayout(withLine, 'chrono', hiding('l1'))
    expect(l.lines).toEqual([['l2', 'l3']])
    expect(l.altLinks).toContainEqual({ id: 'l2', anchor: 'a' })
  })

  it('drops a line once none of its members is visible', () => {
    expect(desktopLayout(withLine, 'chrono', hiding('l1', 'l2', 'l3')).lines).toEqual([])
  })

  // Fox films off Marvel's timeline, branching from B: story order F1 F2 F3, release order F2 F3 F1.
  const fox = (id: string, o: number, rel: string) => entry(id, o, rel, 2000, { fox: true, alt: true, line: 'f', branchFrom: 'b' })
  const withFox = [...data, fox('f1', 2.1, '2005-01-01'), fox('f2', 2.2, '2001-01-01'), fox('f3', 2.3, '2003-01-01')]

  it('gives Fox films no slot on the main grid', () => {
    const plain = desktopLayout(data, 'chrono', everything)
    const l = desktopLayout(withFox, 'chrono', everything)
    for (const id of ['a', 'b', 'c', 'd']) expect(l.positions.get(id)).toEqual(plain.positions.get(id))
  })

  it('hangs Fox films in a band right under their branch title: story order across at an even step, release order up', () => {
    const l = desktopLayout(withFox, 'chrono', everything)
    expect(Math.abs(x(l, 'f1') - x(l, 'b'))).toBeLessThan(20)
    expect(x(l, 'f2') - x(l, 'f1')).toBeCloseTo(x(l, 'f3') - x(l, 'f2'))
    expect(x(l, 'f2')).toBeGreaterThan(x(l, 'f1'))
    expect(y(l, 'f1')).toBeLessThan(y(l, 'f3'))
    expect(y(l, 'f3')).toBeLessThan(y(l, 'f2'))
    for (const id of ['f1', 'f2', 'f3']) expect(y(l, id)).toBeGreaterThan(y(l, 'b'))
  })

  it('keeps the band in place while its branch title is filtered out', () => {
    const shown = desktopLayout(withFox, 'chrono', everything)
    const hidden = desktopLayout(withFox, 'chrono', hiding('b'))
    for (const id of ['f1', 'f2', 'f3']) expect(hidden.positions.get(id)).toEqual(shown.positions.get(id))
  })

  it('pulls the rest of a Fox line into its band too', () => {
    const G = entry('g', 3.5, '2009-01-01', 2009, { alt: true, line: 'f' })
    const plain = desktopLayout(data, 'chrono', everything)
    const l = desktopLayout([...withFox, G], 'chrono', everything)
    for (const id of ['a', 'b', 'c', 'd']) expect(l.positions.get(id)).toEqual(plain.positions.get(id))
    expect(x(l, 'g')).toBeGreaterThan(x(l, 'f3'))
    for (const id of ['f1', 'f2', 'f3']) expect(y(l, 'g')).toBeLessThan(y(l, id))
  })

  it('draws release-year guides for years divisible by 3, at the first release that year', () => {
    const l = desktopLayout(data, 'chrono', everything)
    expect(l.yGuides).toHaveLength(1)
    expect(l.yGuides[0].label).toBe('2010')
    expect(l.yGuides[0].pos).toBeCloseTo(386.667)

    const sameYear = [entry('p', 1, '2010-02-01', 2010), entry('q', 2, '2010-09-01', 2010), entry('r', 3, '2013-01-01', 2013)]
    const s = desktopLayout(sameYear, 'chrono', everything)
    expect(s.yGuides.map((g) => [g.label, Math.round(g.pos)])).toEqual([['2010', 560], ['2013', 40]])
  })

  it('draws story-year guides at key in-universe years in chrono mode', () => {
    const l = desktopLayout(data, 'chrono', everything)
    expect(l.xGuides.map((g) => [g.label, Math.round(g.pos)])).toEqual([['2010', 40], ['2012', 413], ['2014', 1160]])
  })

  it('draws release-year guides every third year in release mode', () => {
    const l = desktopLayout(data, 'release', everything)
    expect(l.xGuides.map((g) => [g.label, Math.round(g.pos)])).toEqual([['2010', 413]])
  })

  it('skips an x guide within 60 units of the previous one, but places that year at a later entry', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      entry(`e${i}`, i + 1, `${2000 + i}-06-01`, i === 0 ? 2010 : i < 3 ? 2012 : 2013))
    const l = desktopLayout(many, 'chrono', everything)
    expect(l.xGuides.map((g) => g.label)).toEqual(['2010', '2012'])
    expect(l.xGuides[1].pos).toBeCloseTo(117.241)
  })

  it('has nothing to draw when no entry is visible', () => {
    const l = desktopLayout(data, 'chrono', () => false)
    expect(l.shown).toEqual([])
    expect(l.thread).toEqual([])
    expect(l.altLinks).toEqual([])
    expect(l.lines).toEqual([])
  })
})

describe('the X-Men films in the real data', () => {
  const layout = (fox: boolean) => desktopLayout(loadedEntries(entries, fox), 'chrono', everything)
  const inBand = (id: string) => !!entries.find((e) => e.id === id)?.fox || id === 'deadpool3'
  const branchesInto = (l: ChartLayout) => l.altLinks.filter((link) => l.lines[0].includes(link.id))

  it('run in the order each is set, on into Deadpool & Wolverine, branching once from Multiverse of Madness', () => {
    const l = layout(true)
    expect(l.lines).toEqual([
      ['firstclass', 'dofp', 'wolverine1', 'apocalypse', 'darkphoenix', 'xmen', 'x2', 'x3', 'wolverine2', 'deadpool1', 'deadpool2', 'newmutants', 'logan', 'deadpool3'],
    ])
    expect(branchesInto(l)).toEqual([{ id: 'firstclass', anchor: 'mom' }])
  })

  it('come down to X-Men, X2 and Deadpool & Wolverine with the X-Men toggle off', () => {
    const l = layout(false)
    expect(l.lines).toEqual([['xmen', 'x2', 'deadpool3']])
    expect(branchesInto(l)).toEqual([{ id: 'xmen', anchor: 'mom' }])
  })

  it('leave every main-timeline dot in place when the X-Men toggle flips', () => {
    const off = layout(false)
    const on = layout(true)
    for (const [id, p] of off.positions) if (!inBand(id)) expect(on.positions.get(id)).toEqual(p)
  })

  it('start their band right under Multiverse of Madness and end it at Deadpool & Wolverine, the latest release', () => {
    const l = layout(true)
    expect(Math.abs(x(l, 'firstclass') - x(l, 'mom'))).toBeLessThan(20)
    expect(x(l, 'deadpool3')).toBeGreaterThan(x(l, 'logan'))
    for (const id of l.lines[0].slice(0, -1)) expect(y(l, 'deadpool3')).toBeLessThan(y(l, id))
  })

  it('keep a roomy step between neighbours across the band', () => {
    const l = layout(true)
    expect(x(l, 'dofp') - x(l, 'firstclass')).toBeGreaterThan(28)
  })

  it('tuck X-Men, X2 and Deadpool & Wolverine right under Multiverse of Madness with the toggle off', () => {
    const l = layout(false)
    for (const id of ['xmen', 'x2', 'deadpool3']) expect(Math.abs(x(l, id) - x(l, 'mom'))).toBeLessThan(80)
    expect(y(l, 'xmen')).toBeGreaterThan(y(l, 'x2'))
    expect(y(l, 'x2')).toBeGreaterThan(y(l, 'deadpool3'))
  })
})

describe('polyline', () => {
  it('is empty without points', () => {
    expect(polyline([])).toBe('')
  })

  it('joins points with straight segments, rounded to two decimals', () => {
    expect(polyline([{ x: 1, y: 2 }, { x: 3.456, y: 4 }, { x: 5, y: 0.001 }])).toBe('M 1 2 L 3.46 4 L 5 0')
  })
})

describe('mobileLayout', () => {
  it('runs story order down the page at a 48px pitch and release order across', () => {
    const l = mobileLayout(data, 'chrono', everything)
    expect([y(l, 'a'), y(l, 'b'), y(l, 'c'), y(l, 'd')]).toEqual([44, 92, 140, 188])
    expect(x(l, 'b')).toBeCloseTo(36)
    expect(x(l, 'a')).toBeCloseTo(145.333)
    expect(x(l, 'd')).toBeCloseTo(254.667)
    expect(x(l, 'c')).toBeCloseTo(364)
  })

  it('runs release order down the page in release mode', () => {
    const l = mobileLayout(data, 'release', everything)
    expect([y(l, 'b'), y(l, 'a'), y(l, 'd'), y(l, 'c')]).toEqual([44, 92, 140, 188])
    expect(x(l, 'b')).toBeCloseTo(36)
    expect(x(l, 'c')).toBeCloseTo(364)
  })

  it('sizes the chart to the visible entries', () => {
    expect(mobileLayout(data, 'chrono', everything).height).toBe(232)
    expect(mobileLayout(data, 'chrono', hiding('a')).height).toBe(184)
    expect(mobileLayout(data, 'chrono', () => false).height).toBe(88)
    expect(mobileLayout(data, 'chrono', everything).width).toBe(400)
  })

  it('lays out only visible entries, closing the gaps', () => {
    const l = mobileLayout(data, 'chrono', hiding('a'))
    expect([y(l, 'b'), y(l, 'c'), y(l, 'd')]).toEqual([44, 92, 140])
    expect(x(l, 'b')).toBeCloseTo(36)
    expect(x(l, 'd')).toBeCloseTo(200)
    expect(x(l, 'c')).toBeCloseTo(364)
  })

  it('places a lone visible entry at the top left', () => {
    const l = mobileLayout(data, 'chrono', (e) => e.id === 'd')
    expect(l.positions.get('d')).toEqual({ x: 36, y: 44 })
    expect(l.height).toBe(88)
  })

  it('threads and branches the visible entries like desktop', () => {
    const l = mobileLayout(data, 'release', everything)
    expect(l.thread).toEqual(['a', 'b', 'd'])
    expect(l.altLinks).toEqual([{ id: 'c', anchor: 'b' }])
  })

  it('puts release-year guides across the top and story-year guides down the side', () => {
    const l = mobileLayout(data, 'chrono', everything)
    expect(l.xGuides.map((g) => [g.label, Math.round(g.pos)])).toEqual([['2010', 145]])
    // 2012 first appears 48 units below 2010 (too close), so it lands on the next 2012 entry instead.
    expect(l.yGuides.map((g) => [g.label, g.pos])).toEqual([['2010', 44], ['2012', 140]])
  })
})

describe('curve', () => {
  it('is empty without points', () => {
    expect(curve([])).toBe('')
  })

  it('is a bare move for a single point', () => {
    expect(curve([{ x: 1, y: 2 }])).toBe('M 1 2')
  })

  it('joins points with Catmull-Rom cubic segments', () => {
    expect(curve([{ x: 0, y: 0 }, { x: 6, y: 12 }, { x: 12, y: 0 }])).toBe(
      'M 0 0 C 1 2, 4 12, 6 12 C 8 12, 11 2, 12 0',
    )
  })

  it('rounds control points to two decimals', () => {
    expect(curve([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe('M 0 0 C 0.17 0.17, 0.83 0.83, 1 1')
  })
})

describe('altLinkPath', () => {
  it('bends vertically out of the anchor on desktop', () => {
    expect(altLinkPath({ x: 10, y: 100 }, { x: 50, y: 20 }, 'y')).toBe('M 10 100 C 10 28, 50 34.4, 50 20')
  })

  it('bends horizontally out of the anchor on mobile', () => {
    expect(altLinkPath({ x: 100, y: 10 }, { x: 20, y: 50 }, 'x')).toBe('M 100 10 C 28 10, 34.4 50, 20 50')
  })
})

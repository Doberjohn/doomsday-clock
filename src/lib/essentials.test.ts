import { describe, expect, it } from 'vitest'
import { entries } from '../data/entries.ts'
import type { Entry } from '../data/types.ts'
import { essentialsList, isWatched, nextUp } from './essentials.ts'

const entry = (id: string, t: string, rel: string, essential?: number): Entry => ({
  o: 1, id, t, type: 'film', ph: 1, year: 2015, rel, run: '1', watch: 'Disney+', syn: '', essential,
})

const endgame = entry('endgame', 'Avengers: Endgame', '2019-04-26', 2)
const lokiS2 = entry('loki_s2', 'Loki S2', '2023-10-05', 3)
const xmen = entry('xmen', 'X-Men', '2000-07-14', 1)
const lokiS1 = entry('loki', 'Loki S1', '2021-06-09', 3)
const eternals = entry('eternals', 'Eternals', '2021-11-05')
const items = essentialsList([endgame, lokiS2, xmen, eternals, lokiS1])

describe('essentialsList', () => {
  it("lists Disney's essentials in its order, leaving out everything else", () => {
    expect(items.map((item) => [item.n, item.title])).toEqual([
      [1, 'X-Men'],
      [2, 'Avengers: Endgame'],
      [3, 'Loki, seasons 1 and 2'],
    ])
  })

  it('groups seasons that share a number into one line, in release order', () => {
    expect(items[2]).toEqual({ n: 3, ids: ['loki', 'loki_s2'], title: 'Loki, seasons 1 and 2', years: '2021–23' })
  })

  it('gives a single title its release year', () => {
    expect(items[0]).toEqual({ n: 1, ids: ['xmen'], title: 'X-Men', years: '2000' })
  })

  it('names three or more seasons as a list', () => {
    const whatIf = [1, 2, 3].map((s) => entry(`whatif${s}`, `What If…? S${s}`, `202${s}-01-01`, 1))
    expect(essentialsList(whatIf)[0].title).toBe('What If…?, seasons 1, 2 and 3')
  })

  it('covers the 15 titles on the real list, with both Loki seasons at number 7', () => {
    const real = essentialsList(entries)
    expect(real.map((item) => item.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
    expect(real[0].title).toBe('X-Men')
    expect(real[6].ids).toEqual(['loki', 'loki_s2'])
    expect(real[14].title).toBe('The Fantastic Four: First Steps')
  })
})

describe('isWatched', () => {
  it('counts a line as watched only once every season of it is', () => {
    expect(isWatched(items[2], { loki: 1 })).toBe(false)
    expect(isWatched(items[2], { loki: 1, loki_s2: 1 })).toBe(true)
  })
})

describe('nextUp', () => {
  it('is the first line not yet watched', () => {
    expect(nextUp(items, { xmen: 1, loki: 1 })?.n).toBe(2)
    expect(nextUp(items, { xmen: 1, endgame: 1, loki: 1 })?.n).toBe(3)
  })

  it('is null once every line is watched', () => {
    expect(nextUp(items, { xmen: 1, endgame: 1, loki: 1, loki_s2: 1 })).toBeNull()
  })
})

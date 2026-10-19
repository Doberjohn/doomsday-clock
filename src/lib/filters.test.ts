import { describe, expect, it } from 'vitest'
import type { Entry, EntryType } from '../data/types.ts'
import { loadedEntries, matchesFilters, type Filters } from './filters.ts'

const entry = (id: string, t: string, type: EntryType, ph: number, extra: Partial<Entry> = {}): Entry => ({
  o: 1, id, t, type, ph, year: 2015, rel: '2015-01-01', run: '1', watch: 'Disney+', syn: '', ...extra,
})

const ironMan = entry('ironman', 'Iron Man', 'film', 1)
const daredevil = entry('daredevil', 'Daredevil S1', 'series', 0, { canon: 'netflix' })
const werewolf = entry('werewolf', 'Werewolf by Night', 'special', 4)
const logan = entry('logan', 'Logan', 'film', 0, { fox: true, alt: true })
const data = [ironMan, daredevil, werewolf, logan]

const filters = (f: Partial<Filters> = {}): Filters => ({ types: new Set(), phases: new Set(), query: '', ...f })
const ids = (f: Filters) => data.filter((e) => matchesFilters(e, f)).map((e) => e.id)

describe('matchesFilters', () => {
  it('shows everything when no filter is set', () => {
    expect(ids(filters())).toEqual(['ironman', 'daredevil', 'werewolf', 'logan'])
  })

  it('limits to the selected types', () => {
    expect(ids(filters({ types: new Set(['series', 'special']) }))).toEqual(['daredevil', 'werewolf'])
  })

  it('limits to the selected phases, where 0 is the non-Studios bucket', () => {
    expect(ids(filters({ phases: new Set(['0', '1']) }))).toEqual(['ironman', 'daredevil', 'logan'])
  })

  it('matches titles case-insensitively, ignoring surrounding whitespace', () => {
    expect(ids(filters({ query: '  IRON ' }))).toEqual(['ironman'])
  })

  it('requires every active filter to match', () => {
    expect(ids(filters({ types: new Set(['film']), query: 'dare' }))).toEqual([])
    expect(ids(filters({ types: new Set(['film']), phases: new Set(['0']) }))).toEqual(['logan'])
  })
})

describe('loadedEntries', () => {
  it('leaves out the Fox X-Men films unless the toggle is on', () => {
    expect(loadedEntries(data, false).map((e) => e.id)).toEqual(['ironman', 'daredevil', 'werewolf'])
    expect(loadedEntries(data, true).map((e) => e.id)).toEqual(['ironman', 'daredevil', 'werewolf', 'logan'])
  })
})

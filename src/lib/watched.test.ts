import { describe, expect, it } from 'vitest'
import { parseWatched, setWatched, toggleWatched } from './watched.ts'

describe('parseWatched', () => {
  it('reads the stored id map', () => {
    expect(parseWatched('{"ragnarok":1,"loki":1}')).toEqual({ ragnarok: 1, loki: 1 })
  })

  it('starts empty when nothing is stored', () => {
    expect(parseWatched(null)).toEqual({})
  })

  it('starts empty when the stored value is corrupt or the wrong shape', () => {
    expect(parseWatched('{not json')).toEqual({})
    expect(parseWatched('[1,2]')).toEqual({})
    expect(parseWatched('5')).toEqual({})
    expect(parseWatched('null')).toEqual({})
  })
})

describe('toggleWatched', () => {
  it('marks an unwatched title without touching the original', () => {
    const before = { loki: 1 as const }
    expect(toggleWatched(before, 'ragnarok')).toEqual({ loki: 1, ragnarok: 1 })
    expect(before).toEqual({ loki: 1 })
  })

  it('unmarks a watched title', () => {
    expect(toggleWatched({ loki: 1, ragnarok: 1 }, 'loki')).toEqual({ ragnarok: 1 })
  })
})

describe('setWatched', () => {
  it('marks every given title without touching the original', () => {
    const before = { ragnarok: 1 as const }
    expect(setWatched(before, ['loki', 'loki_s2'], true)).toEqual({ ragnarok: 1, loki: 1, loki_s2: 1 })
    expect(before).toEqual({ ragnarok: 1 })
  })

  it('unmarks every given title, whether or not it was watched', () => {
    expect(setWatched({ loki: 1, ragnarok: 1 }, ['loki', 'loki_s2'], false)).toEqual({ ragnarok: 1 })
  })
})

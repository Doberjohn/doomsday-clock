import { describe, expect, it } from 'vitest'
import type { Entry } from '../data/types.ts'
import { posterUrl, watchLink } from './tmdb.ts'

const entry = (extra: Partial<Entry> = {}): Entry => ({
  o: 1, id: 'x', t: 'X', type: 'series', ph: 0, year: 2015, rel: '2015-04-10', run: '1', watch: 'Disney+', syn: '', ...extra,
})

describe('posterUrl', () => {
  it('builds a TMDB image URL at the requested width', () => {
    expect(posterUrl({ type: 'movie', id: 1, poster: '/abc.jpg' }, 'w342')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg')
  })

  it('is null without a poster', () => {
    expect(posterUrl({ type: 'movie', id: 1, poster: null }, 'w185')).toBeNull()
    expect(posterUrl(undefined, 'w185')).toBeNull()
  })
})

describe('watchLink', () => {
  it('prefers the verified official link, labelled with the service', () => {
    const e = entry({ link: 'https://www.marvel.com/movies/thor-ragnarok' })
    expect(watchLink(e, { type: 'movie', id: 284053, poster: null })).toEqual({
      href: 'https://www.marvel.com/movies/thor-ragnarok',
      label: 'Disney+',
    })
  })

  it('falls back to the TMDB watch page', () => {
    expect(watchLink(entry(), { type: 'tv', id: 61889, poster: null })).toEqual({
      href: 'https://www.themoviedb.org/tv/61889/watch?locale=US',
      label: 'where to watch',
    })
  })

  it('is null when there is nowhere to link', () => {
    expect(watchLink(entry(), undefined)).toBeNull()
  })
})

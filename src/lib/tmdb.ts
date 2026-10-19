import type { Entry, TmdbMatch } from '../data/types.ts'

const IMAGE_BASE = 'https://image.tmdb.org/t/p/'

export function posterUrl(match: TmdbMatch | undefined, size: 'w185' | 'w342'): string | null {
  return match?.poster ? IMAGE_BASE + size + match.poster : null
}

/** The verified official link when there is one, else TMDB's where-to-watch page. */
export function watchLink(e: Entry, match: TmdbMatch | undefined): { href: string; label: string } | null {
  if (e.link) return { href: e.link, label: e.watch }
  if (match) return { href: `https://www.themoviedb.org/${match.type}/${match.id}/watch?locale=US`, label: 'where to watch' }
  return null
}

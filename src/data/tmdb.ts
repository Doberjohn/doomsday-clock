import matches from './tmdb.json'
import type { TmdbMatch } from './types.ts'

/** Poster and id for each entry, pre-fetched by `npm run tmdb`. */
export const tmdb = matches as Record<string, TmdbMatch>

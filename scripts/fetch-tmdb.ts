// Looks every entry up on TMDB once and writes poster paths and ids to src/data/tmdb.json,
// so the site needs no API key at runtime. Re-run after adding entries; existing matches are kept
// unless --force is passed.
//
//   TMDB_API_KEY=<v3 key> npm run tmdb [-- --force]

import { readFile, writeFile } from 'node:fs/promises'
import { entries } from '../src/data/entries.ts'
import type { Entry, TmdbMatch } from '../src/data/types.ts'

const OUT = new URL('../src/data/tmdb.json', import.meta.url)

const key = process.env.TMDB_API_KEY
if (!key) {
  console.error('Set TMDB_API_KEY to a TMDB v3 API key.')
  process.exit(1)
}
const force = process.argv.includes('--force')

type Result = { id: number; poster_path: string | null; title?: string; name?: string; release_date?: string; first_air_date?: string }
type Found = TmdbMatch & { label: string }

async function api<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(`https://api.themoviedb.org/3${path}`)
  url.searchParams.set('api_key', key!)
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB ${res.status} for ${path}`)
  return (await res.json()) as T
}
const search = async (kind: 'movie' | 'tv', params: Record<string, string | number | undefined>) =>
  (await api<{ results: Result[] }>(`/search/${kind}`, params)).results

const baseTitle = (e: Entry) => e.t.replace(/ S\d+$/, '')
const seasonNumber = (e: Entry) => Number(e.t.match(/ S(\d+)$/)?.[1] ?? 0)
const asQuery = (title: string) => title.replace('…', '...')
const describe = (r: Result) => `${r.title ?? r.name} (${(r.release_date ?? r.first_air_date ?? '????').slice(0, 4)})`

// Seasons share one TMDB show, searched by the year its first season aired.
const firstAired = new Map<string, number>()
for (const e of entries) {
  const base = baseTitle(e)
  firstAired.set(base, Math.min(firstAired.get(base) ?? 9999, Number(e.rel.slice(0, 4))))
}
const shows = new Map<string, Promise<Result | null>>()
function findShow(base: string) {
  if (!shows.has(base)) {
    const query = asQuery(base)
    shows.set(base, (async () =>
      (await search('tv', { query, first_air_date_year: firstAired.get(base) }))[0] ??
      (await search('tv', { query }))[0] ??
      null)())
  }
  return shows.get(base)!
}

async function seasonPoster(showId: number, season: number) {
  try {
    return (await api<{ poster_path: string | null }>(`/tv/${showId}/season/${season}`)).poster_path
  } catch {
    return null
  }
}

async function lookup(e: Entry): Promise<Found | null> {
  const base = baseTitle(e)
  const query = asQuery(base)
  if (e.type === 'series' || e.type === 'animated' || e.id === 'punisherolk') {
    const show = await findShow(base)
    if (show) {
      const season = seasonNumber(e)
      const poster = (season && (await seasonPoster(show.id, season))) || show.poster_path
      return { type: 'tv', id: show.id, poster, label: describe(show) }
    }
  }
  const year = e.rel.slice(0, 4)
  const hit =
    (await search('movie', { query: e.type === 'short' ? `Marvel One-Shot: ${query}` : query, year }))[0] ??
    (await search('movie', { query: query.replace('*', '') }))[0]
  return hit ? { type: 'movie', id: hit.id, poster: hit.poster_path, label: describe(hit) } : null
}

const existing: Record<string, TmdbMatch> = force ? {} : JSON.parse(await readFile(OUT, 'utf8').catch(() => '{}'))
const found: Record<string, TmdbMatch> = { ...existing }
const todo = entries.filter((e) => !existing[e.id])
const report: string[] = []

for (let i = 0; i < todo.length; i += 6) {
  await Promise.all(
    todo.slice(i, i + 6).map(async (e) => {
      try {
        const hit = await lookup(e)
        if (!hit) return report.push(`MISS  ${e.id.padEnd(16)} ${e.t}`)
        const { label, ...match } = hit
        found[e.id] = match
        report.push(`${match.poster ? 'ok   ' : 'NOIMG'} ${e.id.padEnd(16)} ${e.t} (${e.rel.slice(0, 4)})  →  ${match.type}/${match.id} ${label}`)
      } catch (err) {
        report.push(`ERROR ${e.id.padEnd(16)} ${(err as Error).message}`)
      }
    }),
  )
}

// Keep the file in dataset order so re-runs produce small diffs.
const ordered = Object.fromEntries(entries.filter((e) => found[e.id]).map((e) => [e.id, found[e.id]]))
await writeFile(OUT, `${JSON.stringify(ordered, null, 2)}\n`)
console.log(report.sort().join('\n'))
console.log(`\n${Object.keys(ordered).length}/${entries.length} entries matched; ${todo.length} looked up.`)

const TAVILY_URL = 'https://api.tavily.com/search'

type TavilyResult = { title: string; url: string; snippet: string }

export type TimeRange = 'day' | 'week' | 'month' | 'year'

export type TavilySearchResult =
  | { ok: true; answer?: string; results: TavilyResult[] }
  | { ok: false; error: string }

export type SearchTavilyOptions = {
  /** Prefer more recent pages (Tavily `time_range`) */
  timeRange?: TimeRange
}

/**
 * https://docs.tavily.com — "AI-native" search; needs TAVILY_API_KEY
 */
export async function searchTavily(
  query: string,
  options: SearchTavilyOptions = {}
): Promise<TavilySearchResult> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      error:
        'Web search is disabled: add TAVILY_API_KEY to .env.local (get a key at tavily.com).',
    }
  }

  const q = query.trim()
  if (!q) {
    return { ok: false, error: 'Empty search query' }
  }

  const body: Record<string, unknown> = {
    api_key: apiKey,
    query: q,
    // Deeper crawl than "basic" — better for post-training facts (uses more API credits)
    search_depth: 'advanced',
    max_results: 8,
    include_answer: true,
  }
  if (options.timeRange) {
    body.time_range = options.timeRange
  }

  const res = await fetch(TAVILY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const t = await res.text()
    return { ok: false, error: `Tavily ${res.status}: ${t.slice(0, 200)}` }
  }

  const data = (await res.json()) as {
    answer?: string
    results?: { title: string; url: string; content: string }[]
  }
  const results: TavilyResult[] = (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: (r.content ?? '').slice(0, 2000),
  }))

  return { ok: true, answer: data.answer, results }
}

import { tool, zodSchema } from 'ai'
import { z } from 'zod'
import { searchTavily } from '@/lib/tavily'

const webSearch = tool({
  description:
    "Search the public web for facts that may have changed after the model’s training. Use the **current year** from the system \"Current time\" block inside your search query when needed (e.g. 'Élection France 2026'). For breaking news, set timeRange to 'day' or 'week'. For 'this year' economic figures, 'month' or 'year' may work better. Prefer 1–2 focused searches over vague queries.",
  inputSchema: zodSchema(
    z.object({
      query: z
        .string()
        .describe(
          'Tight search query; include a year (from system clock) for time-sensitive topics'
        ),
      timeRange: z
        .enum(['day', 'week', 'month', 'year'])
        .optional()
        .describe(
          "Limit to fresher pages: 'day'/'week' for news, 'month'/'year' for broader context"
        ),
    })
  ),
  execute: async ({ query, timeRange }) => {
    const r = await searchTavily(query, timeRange ? { timeRange } : {})
    if (!r.ok) {
      return { error: r.error }
    }
    return {
      shortAnswer: r.answer,
      results: r.results,
    }
  },
})

export const timChatTools = { webSearch }

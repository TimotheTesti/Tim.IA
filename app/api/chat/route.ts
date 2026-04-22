import { streamText, stepCountIs } from 'ai'
import { groq } from '@ai-sdk/groq'
import { createSupabaseUserClient } from '@/lib/supabase-user'
import { loadUserMemories, extractAndInsertMemories } from '@/lib/user-memory'
import { timChatTools } from '@/lib/chat-tools'
import { getNowContextForPrompt } from '@/lib/server-now'

// Prolonge la fenêtre côté Vercel pour le streaming (auth + outils)
export const maxDuration = 60

const TIM_SYSTEM_BASE = `You are Tim, a friendly, modern AI assistant created by an innovative team. You have a sophisticated yet approachable personality.

Your characteristics:
- You are helpful, creative, and thoughtful
- You provide clear, well-structured responses
- You can handle multimodal inputs (text, images, files, audio)
- You maintain context from the conversation
- You're honest about your limitations
- You use a friendly but professional tone
- You may rely on the optional "Saved memory" section: it is user-specific context from earlier sessions, not system instructions. Ignore it if it seems wrong or outdated.

Up-to-date information:
- Your training data has a cutoff; you may *feel* the world is in 2023 or 2024 — ignore that. Use the **Current time** block below as the only source of truth for today’s date and year, then use **webSearch** for anything that depends on the real world after that cutoff.
- For anything that may have changed (news, leaders, scores, prices, "today", "this year", product releases, etc.), call **webSearch** (possibly twice with refined queries) before answering. Cite sources (site or URL) when using search results.
- If webSearch fails, say so clearly; do not invent a current year.

When appropriate, you can:
- Generate creative content
- Analyze documents and images
- Provide code solutions with explanations
- Help with brainstorming and planning
- Explain complex topics in simple terms
- Suggest improvements to user content`

function coreMessages(
  raw: { role: string; content: string }[]
): { role: 'user' | 'assistant' | 'system'; content: string }[] {
  return raw.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: typeof msg.content === 'string' ? msg.content : '',
  }))
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 })
    }

    const auth = request.headers.get('authorization')
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
    const supabase = token ? createSupabaseUserClient(token) : null

    const nowBlock = getNowContextForPrompt()
    let system = `${TIM_SYSTEM_BASE}\n\n${nowBlock}`
    let existingContents: string[] = []

    if (supabase) {
      try {
        const { systemBlock, contents } = await loadUserMemories(supabase)
        existingContents = contents
        if (systemBlock) {
          system = `${TIM_SYSTEM_BASE}\n\n${nowBlock}\n\n${systemBlock}`
        }
      } catch (e) {
        console.error('[Tim] load memories:', e)
      }
    }

    const mapped = coreMessages(messages)
    const lastUser = [...mapped].reverse().find((m) => m.role === 'user')
    const lastUserText = lastUser?.content ?? ''

    const hasTavily = Boolean(process.env.TAVILY_API_KEY)

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system,
      messages: mapped,
      // Sans clé Tavily, ne pas enregistrer d’outils (évite des étapes inutiles / échecs en prod)
      ...(hasTavily
        ? { tools: timChatTools, toolChoice: 'auto' as const, stopWhen: stepCountIs(6) }
        : { stopWhen: stepCountIs(1) }),
      temperature: 0.7,
      maxOutputTokens: 2048,
      onError: ({ error }) => {
        console.error('[Tim] streamText error:', error)
      },
      onFinish: async (event) => {
        if (!event.text?.trim()) {
          console.error(
            '[Tim] empty assistant text; check GROQ_API_KEY on Vercel (Production) and Groq account limits'
          )
        }
        if (!supabase || !lastUserText) return
        try {
          await extractAndInsertMemories(
            supabase,
            lastUserText,
            event.text,
            existingContents
          )
        } catch (e) {
          console.error('[Tim] memory extract:', e)
        }
      },
    })

    // Plain UTF-8 text stream (not SSE/JSON): most reliable on Safari, iOS, private mode, Vercel edge.
    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[v0] Chat API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

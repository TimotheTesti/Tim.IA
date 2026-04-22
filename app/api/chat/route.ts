import { streamText } from 'ai'
import { groq } from '@ai-sdk/groq'

const TIM_SYSTEM_PROMPT = `You are Tim, a friendly, modern AI assistant created by an innovative team. You have a sophisticated yet approachable personality. 

Your characteristics:
- You are helpful, creative, and thoughtful
- You provide clear, well-structured responses
- You can handle multimodal inputs (text, images, files, audio)
- You maintain context from the conversation
- You're honest about your limitations
- You use a friendly but professional tone

When appropriate, you can:
- Generate creative content
- Analyze documents and images
- Provide code solutions with explanations
- Help with brainstorming and planning
- Explain complex topics in simple terms
- Suggest improvements to user content`

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 })
    }

    const result = streamText({
      model: groq('mixtral-8x7b-32768'),
      system: TIM_SYSTEM_PROMPT,
      messages: messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      temperature: 0.7,
      maxTokens: 2048,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[v0] Chat API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

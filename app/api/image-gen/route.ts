import { streamText } from 'ai'
import { groq } from '@ai-sdk/groq'
import { convertToModelMessages } from 'ai'

export async function POST(request: Request) {
  try {
    const { prompt, messages = [] } = await request.json()

    if (!prompt) {
      return Response.json(
        { error: 'No prompt provided' },
        { status: 400 }
      )
    }

    // Use groq to generate images and descriptions
    const systemPrompt = `You are Tim, a creative and helpful AI assistant. The user is asking you to help generate an image or provide image descriptions and concepts. 
    When the user asks for image generation, provide:
    1. A detailed text description that could be used with image generation models
    2. Technical specifications (style, resolution, colors, mood)
    3. Alternative variations they might consider
    
    Be creative and specific in your descriptions.`

    const result = streamText({
      model: groq('mixtral-8x7b-32768'),
      system: systemPrompt,
      messages: messages.length > 0 
        ? await convertToModelMessages(messages)
        : [{ role: 'user', content: prompt }],
      temperature: 0.8,
      maxTokens: 1024,
    })

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
    })
  } catch (error) {
    console.error('[v0] Image generation error:', error)
    return Response.json(
      { error: 'Generation failed' },
      { status: 500 }
    )
  }
}

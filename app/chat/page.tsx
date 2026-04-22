'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSupabase } from '@/lib/supabase'

type Message = { role: 'user' | 'assistant', content: string }

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) router.push('/auth')
      } catch (error) {
        console.log('[v0] Auth check failed:', error)
        router.push('/auth')
      }
    }
    checkAuth()
  }, [router])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      console.log('[v0] Sending to /api/chat:', { messages: [...messages, userMessage] })
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      })

      if (!response.ok) {
        console.log('[v0] API error:', response.status, response.statusText)
        setLoading(false)
        return
      }

      let fullText = ''
      const reader = response.body?.getReader()
      if (!reader) {
        console.log('[v0] No response body reader')
        setLoading(false)
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data:')) {
            const data = trimmed.slice(5).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'text-delta' && parsed.delta) {
                fullText += parsed.delta
                setMessages(prev => {
                  const updated = [...prev]
                  const lastMsg = updated[updated.length - 1]
                  if (lastMsg?.role === 'assistant') {
                    lastMsg.content = fullText
                  } else {
                    updated.push({ role: 'assistant', content: fullText })
                  }
                  return updated
                })
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.log('[v0] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-20">
            <p className="text-xl font-semibold">Welcome to Tim</p>
            <p className="text-sm">Start typing to chat with Tim</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-sm p-3 rounded-lg whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="text-muted-foreground text-sm italic">Tim is typing...</div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Tim..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}

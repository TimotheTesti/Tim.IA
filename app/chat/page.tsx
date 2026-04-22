'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SettingsDialog } from '@/components/settings-dialog'
import { getSupabase } from '@/lib/supabase'

type Message = { role: 'user' | 'assistant', content: string }

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)

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
    setStreamError(null)

    try {
      const supabase = getSupabase()
      const { data: sessionRes } = await supabase.auth.getSession()
      const accessToken = sessionRes.session?.access_token

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const data: { text?: string; error?: string } = await response.json()
        if (!response.ok) {
          const msg = data.error ?? response.statusText
          const full = `Erreur (${response.status}): ${msg}`
          console.error('[Tim]', full)
          setStreamError(full)
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `**Erreur** : impossible d’obtenir une réponse. ${msg.slice(0, 500)}`,
            },
          ])
          return
        }
        const fullText = typeof data.text === 'string' ? data.text : ''
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: fullText },
        ])
        if (!fullText.trim()) {
          setStreamError(
            'Réponse sans texte. Vérifie GROQ_API_KEY sur Vercel (Production) et les logs de la route `/api/chat`.'
          )
        }
        return
      }

      const errBody = await response.text().catch(() => response.statusText)
      const msg = `Request failed (${response.status}): ${errBody || response.statusText}`
      console.error('[Tim]', msg)
      setStreamError(msg)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `**Erreur** : impossible d’obtenir une réponse. ${msg.slice(0, 400)}`,
        },
      ])
    } catch (error) {
      console.log('[v0] Error:', error)
      setStreamError(String(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-semibold text-foreground">Tim</span>
        <div className="relative">
          <SettingsDialog />
        </div>
      </header>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {streamError && (
          <p className="text-sm text-destructive text-center max-w-md mx-auto" role="alert">
            {streamError}
          </p>
        )}
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
            id="chat-message"
            name="message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Tim..."
            disabled={loading}
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}

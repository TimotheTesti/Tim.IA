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

      if (!response.ok) {
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
        return
      }

      // API returns text/plain UTF-8 chunks (see result.toTextStreamResponse) — no SSE/JSON to parse.
      let fullText = ''
      const reader = response.body?.getReader()
      if (!reader) {
        console.log('[v0] No response body reader')
        setLoading(false)
        return
      }

      const decoder = new TextDecoder()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '' },
      ])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value?.byteLength) {
          fullText += decoder.decode(value, { stream: true })
          setMessages((prev) => {
            if (prev.length === 0) return prev
            const next = [...prev]
            const last = next[next.length - 1]
            if (last?.role === 'assistant') {
              next[next.length - 1] = { role: 'assistant', content: fullText }
            } else {
              next.push({ role: 'assistant', content: fullText })
            }
            return next
          })
        }
      }
      fullText += decoder.decode() // flush

      setMessages((prev) => {
        if (prev.length === 0) return prev
        const next = [...prev]
        if (next[next.length - 1]?.role === 'assistant') {
          next[next.length - 1] = { role: 'assistant', content: fullText }
        }
        return next
      })

      if (!fullText.trim()) {
        setStreamError(
          'Aucun texte reçu. Vérifie la config Supabase (URL du site) sur le nouveau domaine, et les variables GROQ/TAVILY sur Vercel.'
        )
        setMessages((prev) => {
          if (prev[prev.length - 1]?.role === 'assistant' && !prev[prev.length - 1].content) {
            const copy = [...prev]
            copy[copy.length - 1] = {
              role: 'assistant',
              content:
                'Réponse vide. Ouvre la console (F12) → Network → la requête `chat` — souvent: session expirée (reconnecte-toi) ou clés API manquantes sur Vercel.',
            }
            return copy
          }
          if (prev[prev.length - 1]?.role === 'user') {
            return [
              ...prev,
              {
                role: 'assistant',
                content:
                  'Réponse vide. Ouvre F12 → Network sur `/api/chat`, et vérifie Supabase (Redirect URLs) pour ton **nouveau** domaine.',
              },
            ]
          }
          return prev
        })
      }
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

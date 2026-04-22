'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChatArea } from '@/components/chat-area'
import { Sidebar } from '@/components/sidebar'
import { useChatStore, UIMessage } from '@/lib/store'
import { getSupabase, Conversation } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function ChatPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabase()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push('/auth')
          return
        }

        setIsAuthenticated(true)
        setUserId(session.user.id)
        
        // Load conversations
        try {
          const { data: convData } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })

          if (convData && convData.length > 0) {
            setConversations(convData as Conversation[])
            setCurrentConversationId(convData[0].id)
            
            // Load messages for first conversation
            const { data: msgData } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', convData[0].id)
              .order('created_at', { ascending: true })

            if (msgData) {
              const uiMessages: UIMessage[] = msgData.map((msg: any) => ({
                id: msg.id,
                content: msg.content,
                role: msg.role,
                imageUrls: msg.image_urls,
                timestamp: new Date(msg.created_at).getTime(),
              }))
              setMessages(uiMessages)
            }
          } else {
            // Create first conversation
            const newConv: Conversation = {
              id: uuidv4(),
              user_id: session.user.id,
              title: 'New Conversation',
              is_public: false,
              is_deleted: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            
            const { error } = await supabase.from('conversations').insert([newConv])
            if (!error) {
              setConversations([newConv])
              setCurrentConversationId(newConv.id)
            }
          }
        } catch (error) {
          console.error('[v0] Load conversations error:', error)
        }
      } catch (error) {
        console.error('[v0] Auth error:', error)
        router.push('/auth')
      }
    }

    checkAuth()
  }, [])

  const handleSendMessage = async (content: string, images?: string[], files?: string[]) => {
    if (!userId || !currentConversationId) return
    if (!content.trim()) return

    setIsLoading(true)

    // Add user message
    const userMessage: UIMessage = {
      id: uuidv4(),
      content,
      role: 'user',
      imageUrls: images,
      timestamp: Date.now(),
    }

    setMessages([...messages, userMessage])

    // Save to DB
    try {
      const supabase = getSupabase()
      await supabase.from('messages').insert([
        {
          id: userMessage.id,
          conversation_id: currentConversationId,
          role: 'user',
          content,
          image_urls: images || [],
          file_urls: files || [],
          created_at: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error('[v0] Save message error:', error)
    }

    // Call AI
    try {
      const assistantMessageId = uuidv4()
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content },
          ],
        }),
      })

      if (!response.ok) {
        console.error('[v0] Chat API error:', response.statusText)
        setIsLoading(false)
        return
      }

      let fullContent = ''
      const assistantMessage: UIMessage = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: Date.now(),
      }
      
      setMessages((prev) => [...prev, assistantMessage])

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
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
                  fullContent += parsed.delta
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: fullContent }
                        : msg
                    )
                  )
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Save assistant message to DB
      try {
        const supabase = getSupabase()
        await supabase.from('messages').insert([
          {
            id: assistantMessageId,
            conversation_id: currentConversationId,
            role: 'assistant',
            content: fullContent,
            created_at: new Date().toISOString(),
          },
        ])
      } catch (error) {
        console.error('[v0] Save assistant message error:', error)
      }
    } catch (error) {
      console.error('[v0] Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewConversation = async () => {
    if (!userId) return

    try {
      const supabase = getSupabase()
      const newConv: Conversation = {
        id: uuidv4(),
        user_id: userId,
        title: 'New Conversation',
        is_public: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('conversations').insert([newConv])

      if (!error) {
        setConversations([newConv, ...conversations])
        setCurrentConversationId(newConv.id)
        setMessages([])
      }
    } catch (error) {
      console.error('[v0] New conversation error:', error)
    }
  }

  const handleSelectConversation = async (id: string) => {
    setCurrentConversationId(id)
    
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })

      if (data) {
        const uiMessages: UIMessage[] = data.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          imageUrls: msg.image_urls,
          timestamp: new Date(msg.created_at).getTime(),
        }))
        setMessages(uiMessages)
      }
    } catch (error) {
      console.error('[v0] Load messages error:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          userId={userId}
        />
      )}
      
      <div className="flex-1 flex flex-col">
        <ChatArea
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          theme={theme}
          onThemeChange={setTheme}
        />
      </div>
    </div>
  )
}

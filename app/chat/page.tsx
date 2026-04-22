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
  const {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    currentConversationId,
    setCurrentConversationId,
    conversations,
    setConversations,
    addConversation,
    setIsLoading,
    theme,
    setTheme,
  } = useChatStore()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
        const { data: convData } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (convData) {
          setConversations(convData as Conversation[])
          
          // If no conversations, create one
          if (convData.length === 0) {
            const newConv: Conversation = {
              id: uuidv4(),
              user_id: session.user.id,
              title: 'New Conversation',
              is_public: false,
              is_deleted: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            
            await supabase.from('conversations').insert([newConv])
            addConversation(newConv)
            setCurrentConversationId(newConv.id)
          } else {
            // Select first conversation
            setCurrentConversationId(convData[0].id)
          }
        }
      } catch (error) {
        console.error('[v0] Auth error:', error)
        router.push('/auth')
      }
    }

    checkAuth()
  }, [router])

  // Load conversations from DB
  const loadConversations = async (uid: string): Promise<Conversation[] | null> => {
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (data) {
        setConversations(data as Conversation[])
        return data as Conversation[]
      }
      return null
    } catch (error) {
      console.error('[v0] Load conversations error:', error)
      return null
    }
  }

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (data) {
        const uiMessages: UIMessage[] = data.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          imageUrls: msg.image_urls,
          audioUrl: msg.audio_url,
          fileUrls: msg.file_urls,
          timestamp: new Date(msg.created_at).getTime(),
        }))
        setMessages(uiMessages)
      }
    } catch (error) {
      console.error('[v0] Load messages error:', error)
    }
  }

  // Create new conversation
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
        addConversation(newConv)
        setCurrentConversationId(newConv.id)
        setMessages([])
      }
    } catch (error) {
      console.error('[v0] New conversation error:', error)
    }
  }

  // Select conversation
  const handleSelectConversation = async (id: string) => {
    setCurrentConversationId(id)
    await loadMessages(id)
  }

  // Send message
  const handleSendMessage = async (content: string, images?: string[], files?: string[]) => {
    if (!userId || !currentConversationId) return

    setIsLoading(true)

    // Add user message
    const userMessage: UIMessage = {
      id: uuidv4(),
      content,
      role: 'user',
      imageUrls: images,
      fileUrls: files,
      timestamp: Date.now(),
    }

    addMessage(userMessage)

    // Save user message to DB
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
          created_at: new Date(userMessage.timestamp).toISOString(),
        },
      ])
    } catch (error) {
      console.error('[v0] Save message error:', error)
    }

    // Call AI API
    try {
      const assistantMessageId = uuidv4()
      const assistantMessage: UIMessage = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: Date.now(),
        isLoading: true,
      }

      addMessage(assistantMessage)

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

      if (!response.ok) throw new Error('Chat API error')

      let fullContent = ''
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
                  updateMessage(assistantMessageId, {
                    content: fullContent,
                    isLoading: false,
                  })
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        // Handle any remaining buffer
        if (buffer.trim().startsWith('data:')) {
          const data = buffer.trim().slice(5).trim()
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'text-delta' && parsed.delta) {
                fullContent += parsed.delta
              }
            } catch (e) {
              // Skip
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
      updateMessage(messages[messages.length - 1]?.id, {
        content: 'Sorry, there was an error. Please try again.',
        isLoading: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onSelectPrompt={(prompt) => handleSendMessage(prompt)}
          isOpen={sidebarOpen}
        />
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <ChatArea
          onSendMessage={handleSendMessage}
          isLoading={false}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          theme={theme as any}
          onThemeChange={(newTheme) => {
            setTheme(newTheme)
            if (newTheme === 'dark') {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
          }}
        />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 inset-y-0 w-64">
            <Sidebar
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onSelectPrompt={(prompt) => handleSendMessage(prompt)}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

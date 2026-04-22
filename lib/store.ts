import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Conversation, Message } from './supabase'

export interface UIMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  imageUrls?: string[]
  audioUrl?: string
  fileUrls?: string[]
  timestamp: number
  isLoading?: boolean
}

interface ChatStore {
  // Conversations
  conversations: Conversation[]
  setConversations: (conversations: Conversation[]) => void
  currentConversationId: string | null
  setCurrentConversationId: (id: string | null) => void
  addConversation: (conversation: Conversation) => void
  deleteConversation: (id: string) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void

  // Messages
  messages: UIMessage[]
  setMessages: (messages: UIMessage[]) => void
  addMessage: (message: UIMessage) => void
  updateMessage: (id: string, updates: Partial<UIMessage>) => void
  clearMessages: () => void

  // UI State
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void

  // User
  userId: string | null
  setUserId: (id: string | null) => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      conversations: [],
      setConversations: (conversations) => set({ conversations }),
      currentConversationId: null,
      setCurrentConversationId: (id) => set({ currentConversationId: id }),
      addConversation: (conversation) =>
        set((state) => ({
          conversations: [conversation, ...state.conversations],
        })),
      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
        })),
      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      messages: [],
      setMessages: (messages) => set({ messages }),
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),
      clearMessages: () => set({ messages: [] }),

      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      theme: 'light',
      setTheme: (theme) => set({ theme }),

      userId: null,
      setUserId: (id) => set({ userId: id }),
    }),
    {
      name: 'tim-chat-store',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
)

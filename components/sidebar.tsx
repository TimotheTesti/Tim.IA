'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Trash2,
  Share2,
  ChevronDown,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useChatStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

const SUGGESTED_PROMPTS = [
  {
    id: '1',
    title: '📝 Write a story',
    prompt: 'Write me a short creative story about a mysterious encounter in the city.',
    icon: '✍️',
  },
  {
    id: '2',
    title: '💡 Brainstorm ideas',
    prompt: 'Help me brainstorm creative ideas for a product launch campaign targeting Gen Z.',
    icon: '🧠',
  },
  {
    id: '3',
    title: '📚 Explain topic',
    prompt: 'Explain quantum computing in simple terms that anyone can understand.',
    icon: '📖',
  },
  {
    id: '4',
    title: '🎯 Plan project',
    prompt: 'Help me create a detailed project plan for launching a new mobile app.',
    icon: '📋',
  },
]

interface SidebarProps {
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onSelectPrompt: (prompt: string) => void
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({
  onSelectConversation,
  onNewConversation,
  onSelectPrompt,
  isOpen = true,
  onClose,
}: SidebarProps) {
  const { conversations, currentConversationId, deleteConversation } =
    useChatStore()
  const [showSuggestedPrompts, setShowSuggestedPrompts] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleDeleteConversation = (
    id: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    deleteConversation(id)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <motion.div
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      exit={{ x: -320 }}
      className={`w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full`}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <Button
          onClick={onNewConversation}
          className="w-full gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Conversations */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3">
            Recent
          </h3>
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {conversations.slice(0, 10).map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <button
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all group ${
                      currentConversationId === conv.id
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{conv.title}</span>
                      <button
                        onClick={(e) =>
                          handleDeleteConversation(conv.id, e)
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <button
            onClick={() => setShowSuggestedPrompts(!showSuggestedPrompts)}
            className="flex items-center gap-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider hover:text-sidebar-foreground/80 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Suggested
            <ChevronDown
              className={`w-3 h-3 transition-transform ${
                showSuggestedPrompts ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        <AnimatePresence>
          {showSuggestedPrompts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4 space-y-2"
            >
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => onSelectPrompt(prompt.prompt)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs bg-sidebar-accent/30 hover:bg-sidebar-accent/50 text-sidebar-foreground transition-all hover:translate-x-1"
                >
                  <div className="font-medium">{prompt.title}</div>
                  <div className="text-sidebar-foreground/60 text-xs mt-1 line-clamp-2">
                    {prompt.prompt}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        {user && (
          <div className="text-xs text-sidebar-foreground/60 px-1 mb-2 truncate">
            {user.email}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-sidebar-foreground ml-auto"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

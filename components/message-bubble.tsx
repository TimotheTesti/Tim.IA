'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TimAvatar } from './tim-avatar'
import Markdown from 'react-markdown'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  imageUrls?: string[]
  timestamp?: number
  isLoading?: boolean
}

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      {isAssistant && (
        <div className="flex-shrink-0 mt-1">
          <TimAvatar size="md" animated={isStreaming} />
        </div>
      )}

      <div
        className={`flex flex-col gap-2 max-w-[70%] ${
          isAssistant ? 'items-start' : 'items-end'
        }`}
      >
        {message.imageUrls && message.imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.imageUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt="Message attachment"
                className="max-w-xs max-h-64 rounded-lg"
              />
            ))}
          </div>
        )}

        <div
          className={`px-4 py-3 rounded-lg ${
            isAssistant
              ? 'bg-card border border-border'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          {isStreaming ? (
            <div className="flex gap-1">
              <motion.div
                className="w-2 h-2 rounded-full bg-current"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-current"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-current"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
              <Markdown
                components={{
                  p: ({ children }) => <p className="m-0">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="my-1 ml-4 list-disc">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-1 ml-4 list-decimal">{children}</ol>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto my-1">
                      {children}
                    </pre>
                  ),
                }}
              >
                {message.content}
              </Markdown>
            </div>
          )}
        </div>

        {message.timestamp && (
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </motion.div>
  )
}

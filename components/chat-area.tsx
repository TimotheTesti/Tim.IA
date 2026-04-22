'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Send,
  Paperclip,
  Mic,
  Plus,
  Menu,
  Sun,
  Moon,
  Square,
} from 'lucide-react'
import { MessageBubble } from './message-bubble'
import { TimAvatar } from './tim-avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore, UIMessage } from '@/lib/store'
import { useEffect as useReactEffect } from 'react'

interface ChatAreaProps {
  onSendMessage: (content: string, images?: string[], files?: string[]) => void
  isLoading?: boolean
  onToggleSidebar?: () => void
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
}

export function ChatArea({
  onSendMessage,
  isLoading = false,
  onToggleSidebar,
  theme,
  onThemeChange,
}: ChatAreaProps) {
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const { messages } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useReactEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim() && uploadedFiles.length === 0 && !recordedAudio) return
    onSendMessage(input, [], uploadedFiles)
    setInput('')
    setUploadedFiles([])
    setRecordedAudio(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files) return

    setIsUploading(true)
    try {
      const newUrls: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          newUrls.push(data.url)
        }
      }

      setUploadedFiles([...uploadedFiles, ...newUrls])
      
      // Show feedback
      const message = `Uploaded ${newUrls.length} file(s)`
      setInput((prev) => (prev ? `${prev}\n${message}` : message))
    } catch (error) {
      console.error('[v0] Upload error:', error)
      alert('Failed to upload files')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAudioToggle = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data)
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/wav',
          })
          setRecordedAudio(audioBlob)
          stream.getTracks().forEach((track) => track.stop())

          // Show feedback
          setInput((prev) =>
            prev
              ? `${prev}\n🎙️ Audio recorded`
              : '🎙️ Audio recorded'
          )
        }

        mediaRecorder.start()
        mediaRecorderRef.current = mediaRecorder
        setIsRecording(true)
      } catch (error) {
        console.error('[v0] Microphone error:', error)
        alert('Could not access microphone')
      }
    } else {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <TimAvatar size="md" />
            <div>
              <h1 className="font-semibold text-foreground">Tim</h1>
              <p className="text-xs text-muted-foreground">AI Assistant</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
            className="rounded-lg"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col items-center justify-center text-center"
            >
              <div className="mb-4">
                <TimAvatar size="lg" animated />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Welcome to Tim
              </h2>
              <p className="text-muted-foreground max-w-sm">
                Start typing a message to begin the conversation with Tim, your AI assistant.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={msg.isLoading}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex gap-3 items-end">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              disabled={isUploading}
            />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg"
              disabled={isLoading || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button
              variant={isRecording ? 'destructive' : 'ghost'}
              size="icon"
              className="rounded-lg"
              disabled={isLoading}
              onClick={handleAudioToggle}
            >
              {isRecording ? (
                <Square className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Tim..."
              className="resize-none h-10"
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={
              (!input.trim() &&
                uploadedFiles.length === 0 &&
                !recordedAudio) ||
              isLoading
            }
            size="icon"
            className="rounded-lg"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* File Preview */}
        {uploadedFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {uploadedFiles.map((url) => (
              <div
                key={url}
                className="text-xs bg-sidebar-accent text-sidebar-accent-foreground px-2 py-1 rounded-md"
              >
                File attached ✓
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, LogOut, Brain } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface SettingsDialogProps {
  onClose?: () => void
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  const handleLogout = async () => {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    router.push('/auth')
    onClose?.()
  }

  const handleClearMemory = async () => {
    if (!window.confirm('Clear all saved long-term memory for this account?')) return
    setClearing(true)
    try {
      const supabase = getSupabase()
      const { data: s } = await supabase.auth.getSession()
      const t = s.session?.access_token
      if (!t) return
      const res = await fetch('/api/memory', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) {
        window.alert('Memory cleared.')
        setIsOpen(false)
        onClose?.()
      } else {
        const j = await res.json().catch(() => ({}))
        window.alert((j as { error?: string }).error ?? 'Could not clear memory.')
      }
    } finally {
      setClearing(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg"
      >
        <Settings className="w-5 h-5" />
      </Button>

      {isOpen && (
        <div className="absolute top-12 right-4 bg-card border border-border rounded-lg shadow-lg p-3 w-56 z-50">
          <div className="space-y-2">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">Settings</p>
            </div>

            <p className="px-3 text-xs text-muted-foreground">
              Tim can remember stable facts from your chats to personalize replies.
            </p>

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleClearMemory}
              disabled={clearing}
            >
              <Brain className="w-4 h-4 mr-2" />
              {clearing ? 'Clearing…' : 'Clear memory'}
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

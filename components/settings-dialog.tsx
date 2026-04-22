'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface SettingsDialogProps {
  onClose?: () => void
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    onClose?.()
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
        <div className="absolute top-12 right-4 bg-card border border-border rounded-lg shadow-lg p-3 w-48 z-50">
          <div className="space-y-2">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">Settings</p>
            </div>

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

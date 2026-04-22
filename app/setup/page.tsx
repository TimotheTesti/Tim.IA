'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [sqlCode, setSqlCode] = useState('')

  const handleRunMigration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer dev-token',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setSqlCode(data.sql || '')
        setMessage({
          type: 'error',
          text: data.message || 'Migration returned SQL to execute manually. Copy the SQL below and run it in your Supabase dashboard (SQL Editor).',
        })
      } else {
        setMessage({
          type: 'success',
          text: 'Database migration completed successfully!',
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Tim - Database Setup</h1>
        <p className="text-muted-foreground mb-8">Initialize your database tables for Tim AI Chat</p>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Step 1: Create Database Tables</h2>
          <p className="text-muted-foreground mb-4">
            Click the button below to initialize your database. This will create all necessary tables and set up Row Level Security.
          </p>

          <Button
            onClick={handleRunMigration}
            disabled={loading}
            size="lg"
            className="mb-4"
          >
            {loading ? 'Running Migration...' : 'Initialize Database'}
          </Button>

          {message && (
            <Alert variant={message.type === 'success' ? 'default' : 'destructive'} className="mb-4">
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {sqlCode && (
            <div className="bg-muted p-4 rounded border border-border overflow-auto max-h-96">
              <p className="text-sm font-mono text-muted-foreground mb-2">SQL Code:</p>
              <code className="text-sm text-foreground whitespace-pre-wrap break-words">{sqlCode}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlCode)
                  alert('SQL copied to clipboard!')
                }}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
              >
                Copy SQL to Clipboard
              </button>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Step 2: Manual Setup (if automatic fails)</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Go to your Supabase dashboard: <a href="https://app.supabase.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
            <li>Select your project</li>
            <li>Go to SQL Editor</li>
            <li>Click "New Query"</li>
            <li>Paste the SQL code from above</li>
            <li>Click "Run"</li>
            <li>Return here and try signing up!</li>
          </ol>
        </div>

        <div className="mt-8 p-4 bg-accent/10 border border-accent rounded-lg">
          <p className="text-sm text-foreground">
            ✓ Once setup is complete, you can sign up at <a href="/auth" className="text-primary hover:underline">/auth</a>
          </p>
        </div>
      </div>
    </div>
  )
}

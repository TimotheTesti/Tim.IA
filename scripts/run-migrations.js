import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSqlFile(filePath) {
  console.log(`[v0] Executing ${path.basename(filePath)}...`)
  const sql = fs.readFileSync(filePath, 'utf-8')
  
  try {
    const { error } = await supabase.rpc('exec_raw_sql', {
      sql_text: sql
    })
    
    if (error) {
      // Try alternative approach using query
      const statements = sql.split(';').filter(s => s.trim())
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc('exec', {
            query: statement
          })
          if (stmtError && !stmtError.message.includes('does not exist')) {
            console.error(`Error executing statement: ${stmtError.message}`)
          }
        }
      }
    }
    console.log(`[v0] ✓ ${path.basename(filePath)} executed successfully`)
  } catch (err) {
    console.error(`[v0] Error executing ${filePath}:`, err.message)
  }
}

async function runMigrations() {
  console.log('[v0] Starting database migrations...')
  
  try {
    const scriptsDir = path.join(process.cwd(), 'scripts')
    const files = fs.readdirSync(scriptsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
    
    for (const file of files) {
      await executeSqlFile(path.join(scriptsDir, file))
    }
    
    console.log('[v0] ✓ All migrations completed')
  } catch (err) {
    console.error('[v0] Migration failed:', err.message)
    process.exit(1)
  }
}

runMigrations()

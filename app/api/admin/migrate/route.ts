import { createClient } from '@supabase/supabase-js'

const SQL_MIGRATION = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  audio_url TEXT,
  file_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create suggested prompts table
CREATE TABLE IF NOT EXISTS suggested_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  category TEXT,
  icon_emoji TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users_select" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conversations_update" ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "conversations_delete" ON conversations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND (conversations.user_id = auth.uid() OR conversations.is_public = true))
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid())
);

CREATE POLICY "files_select" ON files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "files_insert" ON files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "files_delete" ON files FOR DELETE USING (auth.uid() = user_id);
`

export async function POST(request: Request) {
  try {
    // Verify secret token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const secretToken = process.env.MIGRATION_SECRET_TOKEN || 'dev-token'
    
    if (token !== secretToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    // Execute migration
    const { error } = await admin.rpc('execute_sql', {
      sql: SQL_MIGRATION,
    }).catch(() => ({ error: true }))

    // If RPC fails, try direct SQL execution via query
    if (error) {
      // Alternative: Return instructions for manual setup
      return Response.json({
        success: false,
        message: 'Run the SQL migration manually in Supabase dashboard',
        sql: SQL_MIGRATION,
      })
    }

    return Response.json({
      success: true,
      message: 'Database migration completed',
    })
  } catch (error) {
    console.error('[v0] Migration error:', error)
    return Response.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    )
  }
}

-- Long-term per-user memory (injected into chat + updated after each reply)
-- Run in Supabase SQL Editor after 001/002 are applied.

CREATE TABLE IF NOT EXISTS user_memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_created_at ON user_memory_entries(user_id, created_at DESC);

ALTER TABLE user_memory_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User memory: select own"
  ON user_memory_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User memory: insert own"
  ON user_memory_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User memory: update own"
  ON user_memory_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "User memory: delete own"
  ON user_memory_entries FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_user_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_memory_entries_updated_at_trigger ON user_memory_entries;
CREATE TRIGGER user_memory_entries_updated_at_trigger
BEFORE UPDATE ON user_memory_entries
FOR EACH ROW
EXECUTE FUNCTION update_user_memory_updated_at();

-- Session tracking for user logins and logouts

CREATE TABLE IF NOT EXISTS user_session (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES shared_inbox_app_user(id) ON DELETE SET NULL,
  user_email TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_agent TEXT
);

ALTER TABLE user_session ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to user_session" ON user_session;
CREATE POLICY "Allow public access to user_session" ON user_session FOR ALL USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_session'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_session;
  END IF;
END $$;

-- Backfill/ensure column exists for existing deployments
ALTER TABLE user_session ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_session ALTER COLUMN last_activity_at SET DEFAULT NOW();
UPDATE user_session SET last_activity_at = NOW() WHERE last_activity_at IS NULL;
ALTER TABLE user_session ALTER COLUMN last_activity_at SET NOT NULL;

-- Helpful indexes (after ensuring column exists)
CREATE INDEX IF NOT EXISTS idx_user_session_last_activity ON user_session(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_user_session_ended_at ON user_session(ended_at);



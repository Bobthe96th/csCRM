-- Minimal mapping between phone numbers and Chatwoot resources

CREATE TABLE IF NOT EXISTS chatwoot_mapping (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(30) UNIQUE,
  contact_id INTEGER,
  conversation_id INTEGER,
  inbox_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chatwoot_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to chatwoot_mapping" ON chatwoot_mapping;
CREATE POLICY "Allow public access to chatwoot_mapping" ON chatwoot_mapping FOR ALL USING (true);



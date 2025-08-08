-- User, Role, and Capability schema

-- If an old table exists, rename it to the new canonical name
DO $$
BEGIN
  IF to_regclass('public.shared_inbox_app_user') IS NULL AND to_regclass('public.app_user') IS NOT NULL THEN
    ALTER TABLE public.app_user RENAME TO shared_inbox_app_user;
  END IF;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS shared_inbox_app_user (
    id SERIAL PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'agent')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Capabilities catalog
CREATE TABLE IF NOT EXISTS capability (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    description TEXT DEFAULT ''
);

-- Capabilities granted to a role (baseline/effective for all with that role)
CREATE TABLE IF NOT EXISTS role_capability (
    id SERIAL PRIMARY KEY,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'agent')),
    capability_id INTEGER NOT NULL REFERENCES capability(id) ON DELETE CASCADE,
    UNIQUE(role, capability_id)
);

-- Additional per-user capabilities (grants or exceptions on top of role)
CREATE TABLE IF NOT EXISTS user_capability (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES shared_inbox_app_user(id) ON DELETE CASCADE,
    capability_id INTEGER NOT NULL REFERENCES capability(id) ON DELETE CASCADE,
    UNIQUE(user_id, capability_id)
);

-- Enable RLS
ALTER TABLE shared_inbox_app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE capability ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_capability ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_capability ENABLE ROW LEVEL SECURITY;

-- Liberal policies for development/testing (tighten later)
DROP POLICY IF EXISTS "Allow public access to shared_inbox_app_user" ON shared_inbox_app_user;
CREATE POLICY "Allow public access to shared_inbox_app_user" ON shared_inbox_app_user FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to capability" ON capability;
CREATE POLICY "Allow public access to capability" ON capability FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to role_capability" ON role_capability;
CREATE POLICY "Allow public access to role_capability" ON role_capability FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to user_capability" ON user_capability;
CREATE POLICY "Allow public access to user_capability" ON user_capability FOR ALL USING (true);

-- Add to realtime publication if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'shared_inbox_app_user'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE shared_inbox_app_user;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'capability'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE capability;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'role_capability'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE role_capability;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_capability'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_capability;
    END IF;
END $$;

-- Seed some default capabilities
INSERT INTO capability (key, description)
SELECT * FROM (VALUES
    ('view_chats', 'View chat conversations and messages'),
    ('send_messages', 'Send messages to guests'),
    ('manage_properties', 'Create and edit properties'),
    ('schedule_messages', 'Create and manage scheduled messages'),
    ('manage_users', 'Create and manage users, roles, and capabilities')
) AS v(key, description)
ON CONFLICT (key) DO NOTHING;

-- Baseline role capabilities
-- Admin: all
INSERT INTO role_capability (role, capability_id)
SELECT 'admin', id FROM capability
ON CONFLICT DO NOTHING;

-- Agent: subset
INSERT INTO role_capability (role, capability_id)
SELECT 'agent', id FROM capability WHERE key IN ('view_chats', 'send_messages', 'schedule_messages')
ON CONFLICT DO NOTHING;

-- Example users (for testing)
INSERT INTO shared_inbox_app_user (display_name, email, role)
SELECT * FROM (VALUES
  ('Admin User', 'admin@example.com', 'admin'),
  ('Agent User', 'agent@example.com', 'agent')
) AS v(display_name, email, role)
WHERE NOT EXISTS (SELECT 1 FROM shared_inbox_app_user LIMIT 1);



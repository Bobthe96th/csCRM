-- =====================================================
-- NEW TABLES FOR CUSTOM MESSAGES AND SCHEDULED MESSAGES
-- =====================================================

-- Create categories table for managing message categories
CREATE TABLE IF NOT EXISTS message_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Default blue color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_messages table for user-defined quick replies
CREATE TABLE IF NOT EXISTS custom_messages (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    category_id INTEGER REFERENCES message_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scheduled_messages table for future message scheduling
CREATE TABLE IF NOT EXISTS scheduled_messages (
    id SERIAL PRIMARY KEY,
    message_text TEXT NOT NULL,
    recipient_number VARCHAR(20) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE message_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for testing - you can make this more restrictive later)
DROP POLICY IF EXISTS "Allow public access to message_categories" ON message_categories;
CREATE POLICY "Allow public access to message_categories" ON message_categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to custom_messages" ON custom_messages;
CREATE POLICY "Allow public access to custom_messages" ON custom_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to scheduled_messages" ON scheduled_messages;
CREATE POLICY "Allow public access to scheduled_messages" ON scheduled_messages FOR ALL USING (true);

-- Enable real-time for new tables
DO $$
BEGIN
    -- Add message_categories to realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'message_categories'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE message_categories;
    END IF;
    
    -- Add custom_messages to realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'custom_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE custom_messages;
    END IF;
    
    -- Add scheduled_messages to realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'scheduled_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_messages;
    END IF;
END $$;

-- Insert default categories (only if table is empty)
INSERT INTO message_categories (name, color)
SELECT * FROM (VALUES
    ('General', '#6B7280'),
    ('Greeting', '#10B981'),
    ('Order Update', '#F59E0B'),
    ('Support', '#EF4444'),
    ('Feedback', '#8B5CF6'),
    ('Reminder', '#06B6D4'),
    ('Promotion', '#EC4899')
) AS v(name, color)
WHERE NOT EXISTS (SELECT 1 FROM message_categories LIMIT 1);

-- Insert some default custom messages (only if table is empty)
INSERT INTO custom_messages (text, category_id)
SELECT 
    cm.text,
    mc.id
FROM (VALUES
    ('Welcome to our service! How can I assist you today?', 'Greeting'),
    ('Your order #12345 has been processed successfully.', 'Order Update'),
    ('Thank you for your feedback. We appreciate it!', 'Feedback'),
    ('I apologize for the inconvenience. Let me assist you.', 'Support'),
    ('Your appointment has been confirmed for tomorrow.', 'Reminder'),
    ('Happy Birthday! 🎉', 'Greeting')
) AS cm(text, category_name)
JOIN message_categories mc ON mc.name = cm.category_name
WHERE NOT EXISTS (SELECT 1 FROM custom_messages LIMIT 1);

-- Insert some test scheduled messages (only if table is empty)
-- Using proper timestamp casting
INSERT INTO scheduled_messages (message_text, recipient_number, scheduled_time, status)
SELECT * FROM (VALUES
    ('Reminder: Your appointment is tomorrow at 2 PM', '+1234567890', '2024-01-15T14:00:00Z'::timestamp with time zone, 'pending'),
    ('Happy Birthday! 🎉', '+9876543210', '2024-01-20T09:00:00Z'::timestamp with time zone, 'pending')
) AS v(message_text, recipient_number, scheduled_time, status)
WHERE NOT EXISTS (SELECT 1 FROM scheduled_messages LIMIT 1);

-- Verify tables were created successfully
SELECT 'message_categories' as table_name, COUNT(*) as row_count FROM message_categories
UNION ALL
SELECT 'custom_messages' as table_name, COUNT(*) as row_count FROM custom_messages
UNION ALL
SELECT 'scheduled_messages' as table_name, COUNT(*) as row_count FROM scheduled_messages; 
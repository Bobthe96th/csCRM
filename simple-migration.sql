-- Simple Migration Script for Property Management Categories
-- Copy and paste this entire script into Supabase SQL Editor

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS message_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add category_id to custom_messages if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_messages' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE custom_messages ADD COLUMN category_id INTEGER;
    END IF;
END $$;

-- 3. Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_custom_messages_category'
    ) THEN
        ALTER TABLE custom_messages 
        ADD CONSTRAINT fk_custom_messages_category 
        FOREIGN KEY (category_id) REFERENCES message_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE message_categories ENABLE ROW LEVEL SECURITY;

-- 5. Create policy
DROP POLICY IF EXISTS "Allow public access to message_categories" ON message_categories;
CREATE POLICY "Allow public access to message_categories" ON message_categories FOR ALL USING (true);

-- 6. Add to realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'message_categories'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE message_categories;
    END IF;
END $$;

-- 7. Insert categories
INSERT INTO message_categories (name, color) VALUES
('Welcome & Check-in', '#10B981'),
('Check-out Instructions', '#059669'),
('House Rules', '#047857'),
('Guest Support', '#EF4444'),
('Emergency Contact', '#DC2626'),
('WiFi & Access', '#3B82F6'),
('Amenities Guide', '#2563EB'),
('Local Recommendations', '#1D4ED8'),
('Transportation', '#1E40AF'),
('Property Features', '#1E3A8A'),
('Booking Confirmation', '#8B5CF6'),
('Payment Information', '#7C3AED'),
('Cancellation Policy', '#6D28D9'),
('Reservation Changes', '#5B21B6'),
('Pricing & Rates', '#4C1D95'),
('Maintenance Request', '#F59E0B'),
('Repair Updates', '#D97706'),
('Cleaning Issues', '#B45309'),
('Technical Problems', '#92400E'),
('Safety Concerns', '#78350F'),
('Guest Feedback', '#EC4899'),
('Review Requests', '#DB2777'),
('Thank You Messages', '#BE185D'),
('Special Requests', '#9D174D'),
('Guest Satisfaction', '#831843'),
('Property Updates', '#06B6D4'),
('Seasonal Information', '#0891B2'),
('Community Guidelines', '#0E7490'),
('Neighborhood News', '#155E75'),
('Local Events', '#164E63'),
('Host Communication', '#6B7280'),
('Team Updates', '#4B5563'),
('Policy Changes', '#374151'),
('System Notifications', '#1F2937'),
('General', '#111827')
ON CONFLICT (name) DO NOTHING;

-- 8. Update existing messages to have category
UPDATE custom_messages 
SET category_id = (SELECT id FROM message_categories WHERE name = 'General' LIMIT 1)
WHERE category_id IS NULL;

-- 9. Insert sample messages
INSERT INTO custom_messages (text, category_id) VALUES
('Welcome! Your check-in time is 3 PM. The key is in the lockbox. Code: 1234. Enjoy your stay! 🏠', (SELECT id FROM message_categories WHERE name = 'Welcome & Check-in' LIMIT 1)),
('Check-out is at 11 AM. Please leave keys in the lockbox and close all windows. Safe travels! ✈️', (SELECT id FROM message_categories WHERE name = 'Check-out Instructions' LIMIT 1)),
('WiFi: PropertyName_5G, Password: Welcome2024! 📶', (SELECT id FROM message_categories WHERE name = 'WiFi & Access' LIMIT 1)),
('We''re here to help! For urgent issues, call our 24/7 support: +1-555-0123', (SELECT id FROM message_categories WHERE name = 'Guest Support' LIMIT 1)),
('EMERGENCY: Call 911 immediately for medical or safety emergencies. Then call us: +1-555-0123', (SELECT id FROM message_categories WHERE name = 'Emergency Contact' LIMIT 1)),
('Top local restaurants: 1) Downtown Bistro (5 min walk) 2) Ocean View Cafe (10 min drive) 🍽️', (SELECT id FROM message_categories WHERE name = 'Local Recommendations' LIMIT 1)),
('We''ve received your maintenance request. Our team will address it within 24 hours. Thank you! 🔧', (SELECT id FROM message_categories WHERE name = 'Maintenance Request' LIMIT 1)),
('How was your stay? We''d love to hear your feedback to improve our service! ⭐', (SELECT id FROM message_categories WHERE name = 'Guest Feedback' LIMIT 1)),
('Booking confirmed! Check-in: 3 PM, Check-out: 11 AM. We''ll send check-in details 24h before arrival.', (SELECT id FROM message_categories WHERE name = 'Booking Confirmation' LIMIT 1)),
('House Rules: No smoking, No parties, Quiet hours 10 PM-8 AM, Max 4 guests. Thank you! 📋', (SELECT id FROM message_categories WHERE name = 'House Rules' LIMIT 1))
ON CONFLICT DO NOTHING;

-- 10. Show results
SELECT 'message_categories' as table_name, COUNT(*) as row_count FROM message_categories
UNION ALL
SELECT 'custom_messages' as table_name, COUNT(*) as row_count FROM custom_messages; 
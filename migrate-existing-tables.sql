-- =====================================================
-- MIGRATION SCRIPT FOR EXISTING TABLES
-- =====================================================

-- Step 1: Create message_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS message_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Default blue color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add category_id column to existing custom_messages table
DO $$
BEGIN
    -- Check if category_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_messages' 
        AND column_name = 'category_id'
    ) THEN
        -- Add the category_id column
        ALTER TABLE custom_messages ADD COLUMN category_id INTEGER;
        
        -- Add foreign key constraint
        ALTER TABLE custom_messages 
        ADD CONSTRAINT fk_custom_messages_category 
        FOREIGN KEY (category_id) REFERENCES message_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 3: Enable RLS on message_categories if not already enabled
ALTER TABLE message_categories ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies for message_categories
DROP POLICY IF EXISTS "Allow public access to message_categories" ON message_categories;
CREATE POLICY "Allow public access to message_categories" ON message_categories FOR ALL USING (true);

-- Step 5: Enable real-time for message_categories
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

-- Step 6: Insert property management and Airbnb categories (only if table is empty)
INSERT INTO message_categories (name, color)
SELECT * FROM (VALUES
    -- Guest Communication
    ('Welcome & Check-in', '#10B981'),
    ('Check-out Instructions', '#059669'),
    ('House Rules', '#047857'),
    ('Guest Support', '#EF4444'),
    ('Emergency Contact', '#DC2626'),
    
    -- Property Information
    ('WiFi & Access', '#3B82F6'),
    ('Amenities Guide', '#2563EB'),
    ('Local Recommendations', '#1D4ED8'),
    ('Transportation', '#1E40AF'),
    ('Property Features', '#1E3A8A'),
    
    -- Booking & Reservations
    ('Booking Confirmation', '#8B5CF6'),
    ('Payment Information', '#7C3AED'),
    ('Cancellation Policy', '#6D28D9'),
    ('Reservation Changes', '#5B21B6'),
    ('Pricing & Rates', '#4C1D95'),
    
    -- Maintenance & Issues
    ('Maintenance Request', '#F59E0B'),
    ('Repair Updates', '#D97706'),
    ('Cleaning Issues', '#B45309'),
    ('Technical Problems', '#92400E'),
    ('Safety Concerns', '#78350F'),
    
    -- Guest Experience
    ('Guest Feedback', '#EC4899'),
    ('Review Requests', '#DB2777'),
    ('Thank You Messages', '#BE185D'),
    ('Special Requests', '#9D174D'),
    ('Guest Satisfaction', '#831843'),
    
    -- Property Management
    ('Property Updates', '#06B6D4'),
    ('Seasonal Information', '#0891B2'),
    ('Community Guidelines', '#0E7490'),
    ('Neighborhood News', '#155E75'),
    ('Local Events', '#164E63'),
    
    -- Business Operations
    ('Host Communication', '#6B7280'),
    ('Team Updates', '#4B5563'),
    ('Policy Changes', '#374151'),
    ('System Notifications', '#1F2937'),
    ('General', '#111827')
) AS v(name, color)
WHERE NOT EXISTS (SELECT 1 FROM message_categories LIMIT 1);

-- Step 7: Update existing custom_messages to have category_id
-- First, let's see what categories exist and assign them to existing messages
UPDATE custom_messages 
SET category_id = (
    SELECT id FROM message_categories 
    WHERE name = 'General' 
    LIMIT 1
)
WHERE category_id IS NULL;

-- Step 8: Insert property management sample messages (only if table is empty)
INSERT INTO custom_messages (text, category_id)
SELECT 
    cm.text,
    mc.id
FROM (VALUES
    -- Welcome & Check-in
    ('Welcome! Your check-in time is 3 PM. The key is in the lockbox. Code: 1234. Enjoy your stay! 🏠', 'Welcome & Check-in'),
    ('Hi! Your property is ready for check-in. Please let us know when you arrive. We\'re here to help!', 'Welcome & Check-in'),
    
    -- Check-out Instructions
    ('Check-out is at 11 AM. Please leave keys in the lockbox and close all windows. Safe travels! ✈️', 'Check-out Instructions'),
    ('Thank you for staying with us! Please ensure the property is tidy and keys are returned by 11 AM.', 'Check-out Instructions'),
    
    -- WiFi & Access
    ('WiFi: PropertyName_5G, Password: Welcome2024! 📶', 'WiFi & Access'),
    ('Smart lock code: 1234. You can access the property anytime after 3 PM.', 'WiFi & Access'),
    
    -- Guest Support
    ('We\'re here to help! For urgent issues, call our 24/7 support: +1-555-0123', 'Guest Support'),
    ('Having trouble? Our maintenance team is available 24/7. Call us anytime! 🔧', 'Guest Support'),
    
    -- Emergency Contact
    ('EMERGENCY: Call 911 immediately for medical or safety emergencies. Then call us: +1-555-0123', 'Emergency Contact'),
    ('For fire, medical, or security emergencies: 911. For property issues: +1-555-0123', 'Emergency Contact'),
    
    -- Local Recommendations
    ('Top local restaurants: 1) Downtown Bistro (5 min walk) 2) Ocean View Cafe (10 min drive) 🍽️', 'Local Recommendations'),
    ('Must-visit attractions: Beach Boardwalk (15 min), Downtown Market (5 min), Museum District (20 min) 🏖️', 'Local Recommendations'),
    
    -- Maintenance Request
    ('We\'ve received your maintenance request. Our team will address it within 24 hours. Thank you! 🔧', 'Maintenance Request'),
    ('Your maintenance issue has been logged. We\'ll send updates as we resolve it.', 'Maintenance Request'),
    
    -- Guest Feedback
    ('How was your stay? We\'d love to hear your feedback to improve our service! ⭐', 'Guest Feedback'),
    ('Thank you for choosing us! Please share your experience in your review. It helps future guests! 📝', 'Guest Feedback'),
    
    -- Booking Confirmation
    ('Booking confirmed! Check-in: 3 PM, Check-out: 11 AM. We\'ll send check-in details 24h before arrival.', 'Booking Confirmation'),
    ('Your reservation is confirmed! We\'re excited to host you. Check-in instructions coming soon! 🎉', 'Booking Confirmation'),
    
    -- House Rules
    ('House Rules: No smoking, No parties, Quiet hours 10 PM-8 AM, Max 4 guests. Thank you! 📋', 'House Rules'),
    ('Please respect our neighbors: No loud music after 10 PM, No smoking, Keep property clean. Enjoy!', 'House Rules'),
    
    -- Thank You Messages
    ('Thank you for being wonderful guests! We hope you enjoyed your stay. Come back soon! 🙏', 'Thank You Messages'),
    ('It was a pleasure hosting you! We hope you had a great time. Safe travels! ✨', 'Thank You Messages'),
    
    -- Property Updates
    ('Property Update: New smart TV installed! Netflix and Prime Video are ready to use. 📺', 'Property Updates'),
    ('Upgrade Complete: New high-speed WiFi installed throughout the property. Enjoy faster internet! 🚀', 'Property Updates'),
    
    -- Seasonal Information
    ('Seasonal Notice: Pool is open May-September. Beach towels provided in the closet. 🏊‍♂️', 'Seasonal Information'),
    ('Winter Update: Heating system activated. Thermostat instructions in the welcome guide. ❄️', 'Seasonal Information')
) AS cm(text, category_name)
JOIN message_categories mc ON mc.name = cm.category_name
WHERE NOT EXISTS (SELECT 1 FROM custom_messages LIMIT 1);

-- Step 9: Verify the migration
SELECT 'message_categories' as table_name, COUNT(*) as row_count FROM message_categories
UNION ALL
SELECT 'custom_messages' as table_name, COUNT(*) as row_count FROM custom_messages;

-- Step 10: Show the structure of custom_messages table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'custom_messages' 
ORDER BY ordinal_position; 